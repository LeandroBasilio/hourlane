import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { leadSubmissionSchema, type LeadSubmission } from "../leads/schema";
import { getLeadCaptureConfig, type LeadCaptureConfig } from "./config";
import { getDatabasePool } from "./db";

const MAX_BODY_BYTES = 16 * 1024;
const WINDOW_SECONDS = 15 * 60;
const MAX_SUBMISSIONS = 5;

function response(
  status: number,
  body: object,
  headers?: Record<string, string>,
): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function failure(
  status: number,
  message: string,
  errors?: Record<string, string>,
  headers?: Record<string, string>,
) {
  return response(
    status,
    { ok: false, message, ...(errors ? { errors } : {}) },
    headers,
  );
}

class BodyTooLargeError extends Error {}

async function readJson(request: Request): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (
    declaredLength &&
    (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY_BYTES)
  ) {
    throw new BodyTooLargeError();
  }
  if (!request.body) throw new SyntaxError("Empty body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new BodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)),
  );
}

function clientBucketIdentity(
  request: Request,
  config: LeadCaptureConfig,
): string {
  // Vercel's dedicated header remains authoritative even with a proxy in front.
  // Never trust forwarded headers on other hosts.
  // A missing/ambiguous header uses the more restrictive shared bucket.
  if (config.trustVercelProxy) {
    const candidate = request.headers.get("x-vercel-forwarded-for")?.trim();
    if (candidate && isIP(candidate)) return candidate;
  }
  return "shared-origin";
}

function digestPayload(lead: LeadSubmission): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        lead.name,
        lead.email,
        lead.company,
        lead.industry,
        lead.challenge,
      ]),
    )
    .digest("hex");
}

export async function handleLeadSubmission(
  request: Request,
): Promise<Response> {
  const config = getLeadCaptureConfig();
  if (!config)
    return failure(
      503,
      "Das Anfrageformular ist zurzeit nicht verfügbar. Bitte versuchen Sie es später erneut.",
    );
  if (request.method !== "POST")
    return failure(405, "Diese Anfrageart wird nicht unterstützt.", undefined, {
      Allow: "POST",
    });
  if (
    request.headers.get("origin") !== config.origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return failure(
      403,
      "Die Anfrage konnte nicht zugeordnet werden. Bitte das Formular auf unserer Website verwenden.",
    );
  }
  if (
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase() !== "application/json"
  ) {
    return failure(415, "Die Anfrage hat ein ungültiges Format.");
  }

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    return error instanceof BodyTooLargeError
      ? failure(413, "Die Anfrage ist zu groß. Bitte den Text kürzen.")
      : failure(
          400,
          "Die Anfrage konnte nicht gelesen werden. Bitte das Formular erneut senden.",
        );
  }
  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors))
        errors[field] = issue.message;
    }
    return failure(422, "Bitte die markierten Angaben prüfen.", errors);
  }
  const lead = parsed.data;
  if (lead.website !== "")
    return failure(
      422,
      "Die Anfrage konnte nicht angenommen werden. Bitte das Formular erneut ausfüllen.",
    );

  let client;
  try {
    client = await getDatabasePool(config.databaseUrl).connect();
    await client.query("BEGIN");
    // Serialize only identical request IDs; this makes simultaneous retries idempotent.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [lead.requestId],
    );
    const digest = digestPayload(lead);
    const existing = await client.query<{ payload_digest: string }>(
      "SELECT payload_digest FROM hourlane.leads WHERE request_id = $1",
      [lead.requestId],
    );
    if (existing.rowCount) {
      await client.query("COMMIT");
      return existing.rows[0].payload_digest === digest
        ? response(200, { ok: true })
        : failure(
            409,
            "Diese Anfrage wurde bereits mit anderen Angaben gesendet. Bitte eine neue Anfrage beginnen.",
          );
    }

    const clock = await client.query<{
      window_id: string;
      retry_after: number;
    }>(
      `SELECT floor(extract(epoch FROM clock_timestamp()) / $1)::bigint::text AS window_id,
       ceil($1 - mod(extract(epoch FROM clock_timestamp()), $1))::integer AS retry_after`,
      [WINDOW_SECONDS],
    );
    const { window_id: windowId, retry_after: retryAfter } = clock.rows[0];
    const key = createHmac("sha256", config.rateLimitSecret)
      .update(`leads:${windowId}:${clientBucketIdentity(request, config)}`)
      .digest("hex");
    await client.query(
      "DELETE FROM hourlane.rate_limit_buckets WHERE expires_at <= clock_timestamp()",
    );
    const bucket = await client.query(
      `INSERT INTO hourlane.rate_limit_buckets (bucket_key, attempts, expires_at)
       VALUES ($1, 1, to_timestamp(($2::bigint + 1) * $3))
       ON CONFLICT (bucket_key) DO UPDATE SET attempts = hourlane.rate_limit_buckets.attempts + 1
       WHERE hourlane.rate_limit_buckets.attempts < $4 RETURNING attempts`,
      [key, windowId, WINDOW_SECONDS, MAX_SUBMISSIONS],
    );
    if (!bucket.rowCount) {
      await client.query("COMMIT");
      return failure(
        429,
        "Es wurden zu viele Anfragen gesendet. Bitte versuchen Sie es in einigen Minuten erneut.",
        undefined,
        { "Retry-After": String(retryAfter) },
      );
    }
    await client.query(
      `INSERT INTO hourlane.leads
       (id, request_id, payload_digest, name, email, company, industry, challenge, privacy_notice_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        randomUUID(),
        lead.requestId,
        digest,
        lead.name,
        lead.email,
        lead.company,
        lead.industry || null,
        lead.challenge,
        config.privacyNoticeVersion,
      ],
    );
    await client.query("COMMIT");
    return response(201, { ok: true });
  } catch {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* Connection may already be gone. */
      }
    }
    console.error("hourlane_lead_storage_unavailable");
    return failure(
      503,
      "Die Speicherung konnte nicht bestätigt werden. Bitte versuchen Sie es erneut; eine Wiederholung wird nicht doppelt gespeichert.",
    );
  } finally {
    client?.release();
  }
}
