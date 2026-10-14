import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, describe, test } from "node:test";
import { Pool } from "pg";
import { handleLeadSubmission } from "../src/lib/server/lead-handler";
import { closeDatabasePools } from "../src/lib/server/db";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const originalDatabaseUrl = process.env.DATABASE_URL;
const origin = "http://localhost:3000";
const environmentNames = [
  "DATABASE_URL",
  "APP_ORIGIN",
  "RATE_LIMIT_SECRET",
  "LEAD_CAPTURE_ENABLED",
  "TRUST_PROXY",
  "VERCEL",
  "PRIVACY_NOTICE_VERSION",
];
const savedEnvironment = Object.fromEntries(
  environmentNames.map((name) => [name, process.env[name]]),
);

function payload(overrides: Record<string, unknown> = {}) {
  return {
    requestId: randomUUID(),
    name: "Testperson",
    email: "test@example.test",
    company: "Testbetrieb",
    industry: "shk",
    challenge: "Diese Testanfrage enthält keine echten Kundendaten.",
    website: "",
    ...overrides,
  };
}

function request(data: unknown, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/leads`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
}

describe(
  "PostgreSQL lead capture",
  { skip: !testDatabaseUrl, concurrency: false },
  () => {
    let admin: Pool;

    before(async () => {
      assert.ok(testDatabaseUrl);
      const url = new URL(testDatabaseUrl);
      // The suite truncates tables. Refuse production URLs, remote hosts, and ambiguous database names.
      assert.ok(
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname),
        "Test database must be local.",
      );
      assert.match(
        decodeURIComponent(url.pathname),
        /\/hourlane[a-z0-9_]*_test$/i,
        "Database name must be hourlane…_test.",
      );
      assert.notEqual(
        testDatabaseUrl,
        originalDatabaseUrl,
        "TEST_DATABASE_URL must differ from DATABASE_URL.",
      );
      Object.assign(process.env, {
        DATABASE_URL: testDatabaseUrl,
        APP_ORIGIN: origin,
        LEAD_CAPTURE_ENABLED: "true",
        RATE_LIMIT_SECRET: "integration-test-only-secret-32-characters-long",
        PRIVACY_NOTICE_VERSION: "2026-10-14-draft",
      });
      delete process.env.TRUST_PROXY;
      delete process.env.VERCEL;
      admin = new Pool({ connectionString: testDatabaseUrl, max: 2 });
      const current = await admin.query("SELECT current_database() AS name");
      assert.match(current.rows[0].name, /^hourlane[a-z0-9_]*_test$/i);
      await admin.query("SELECT 1 FROM hourlane.schema_migrations LIMIT 1");
    });

    beforeEach(async () => {
      await admin.query("TRUNCATE hourlane.leads, hourlane.rate_limit_buckets");
    });

    after(async () => {
      // Cleanup is deliberately limited to the independently checked test database.
      if (admin) {
        await admin.query(
          "TRUNCATE hourlane.leads, hourlane.rate_limit_buckets",
        );
        await admin.end();
      }
      await closeDatabasePools();
      for (const [name, value] of Object.entries(savedEnvironment)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    });

    test("201 follows persistent insert; an independent connection sees normalized data", async () => {
      const data = payload({
        name: "  Testperson  ",
        email: "TEST@example.test",
      });
      const result = await handleLeadSubmission(request(data));
      assert.equal(result.status, 201);
      assert.deepEqual(await result.json(), { ok: true });
      assert.equal(result.headers.get("cache-control"), "no-store");
      const saved = await admin.query(
        "SELECT * FROM hourlane.leads WHERE request_id = $1",
        [data.requestId],
      );
      assert.equal(saved.rowCount, 1);
      assert.equal(saved.rows[0].name, "Testperson");
      assert.equal(saved.rows[0].email, "test@example.test");
      assert.equal(saved.rows[0].status, "open");
      assert.equal(saved.rows[0].privacy_notice_version, "2026-10-14-draft");
      assert.equal(saved.rows[0].delete_after, null);
      assert.equal("ip" in saved.rows[0], false);
    });

    test("simultaneous identical retries create one row and consume one rate-limit slot", async () => {
      const data = payload();
      const results = await Promise.all(
        Array.from({ length: 8 }, () => handleLeadSubmission(request(data))),
      );
      assert.deepEqual(
        results.map((result) => result.status).sort(),
        [200, 200, 200, 200, 200, 200, 200, 201],
      );
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::integer AS count FROM hourlane.leads",
          )
        ).rows[0].count,
        1,
      );
      assert.equal(
        (await admin.query("SELECT attempts FROM hourlane.rate_limit_buckets"))
          .rows[0].attempts,
        1,
      );
      const mismatch = await handleLeadSubmission(
        request({
          ...data,
          challenge: "Eine andere Herausforderung als zuvor.",
        }),
      );
      assert.equal(mismatch.status, 409);
    });

    test("parallel new submissions cannot exceed the shared atomic limit", async () => {
      const data = Array.from({ length: 10 }, () => payload());
      const results = await Promise.all(
        data.map((lead, index) =>
          handleLeadSubmission(
            request(lead, { "x-forwarded-for": `192.0.2.${index + 1}` }),
          ),
        ),
      );
      assert.equal(results.filter((result) => result.status === 201).length, 5);
      assert.equal(results.filter((result) => result.status === 429).length, 5);
      for (const result of results.filter((item) => item.status === 429)) {
        assert.ok(Number(result.headers.get("retry-after")) > 0);
      }
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::integer AS count FROM hourlane.leads",
          )
        ).rows[0].count,
        5,
      );
      const accepted =
        data[results.findIndex((result) => result.status === 201)];
      assert.equal((await handleLeadSubmission(request(accepted))).status, 200);
    });

    test("trusted Vercel mode separates validated client IPs", async () => {
      process.env.TRUST_PROXY = "vercel";
      process.env.VERCEL = "1";
      try {
        for (let index = 1; index <= 6; index++) {
          const result = await handleLeadSubmission(
            request(payload(), {
              "x-vercel-forwarded-for": `192.0.2.${index}`,
            }),
          );
          assert.equal(result.status, 201);
        }
        assert.equal(
          (
            await admin.query(
              "SELECT count(*)::integer AS count FROM hourlane.rate_limit_buckets",
            )
          ).rows[0].count,
          6,
        );
      } finally {
        delete process.env.TRUST_PROXY;
        delete process.env.VERCEL;
      }
    });

    test("invalid input, honeypot, wrong origin, and malformed JSON never save a lead", async () => {
      assert.equal(
        (await handleLeadSubmission(request(payload({ email: "bad" })))).status,
        422,
      );
      assert.equal(
        (await handleLeadSubmission(request(payload({ website: "spam" }))))
          .status,
        422,
      );
      assert.equal(
        (
          await handleLeadSubmission(
            request(payload(), { origin: "https://other.example" }),
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await handleLeadSubmission(
            request(payload(), { "sec-fetch-site": "cross-site" }),
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await handleLeadSubmission(
            request(payload(), { "content-type": "text/plain" }),
          )
        ).status,
        415,
      );
      const broken = new Request(`${origin}/api/leads`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: "{",
      });
      assert.equal((await handleLeadSubmission(broken)).status, 400);
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::integer AS count FROM hourlane.leads",
          )
        ).rows[0].count,
        0,
      );
    });

    test("body limits apply to both declared length and actual streamed bytes", async () => {
      assert.equal(
        (
          await handleLeadSubmission(
            request(payload(), { "content-length": "99999" }),
          )
        ).status,
        413,
      );
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"challenge":"'));
          controller.enqueue(new TextEncoder().encode("x".repeat(17_000)));
          controller.close();
        },
      });
      const streamed = new Request(`${origin}/api/leads`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: stream,
        duplex: "half",
      } as RequestInit);
      assert.equal((await handleLeadSubmission(streamed)).status, 413);
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::integer AS count FROM hourlane.leads",
          )
        ).rows[0].count,
        0,
      );
    });

    test("expired abuse records are cleaned and retention state is constrained", async () => {
      await admin.query(
        "INSERT INTO hourlane.rate_limit_buckets VALUES ($1, 1, clock_timestamp() - interval '1 hour')",
        ["0".repeat(64)],
      );
      const data = payload();
      assert.equal((await handleLeadSubmission(request(data))).status, 201);
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::integer AS count FROM hourlane.rate_limit_buckets",
          )
        ).rows[0].count,
        1,
      );
      await assert.rejects(
        admin.query(
          "UPDATE hourlane.leads SET status = 'closed', closed_at = clock_timestamp() WHERE request_id = $1",
          [data.requestId],
        ),
      );
      const privileges = await admin.query(`SELECT count(*)::integer AS count
      FROM information_schema.table_privileges WHERE table_schema = 'hourlane' AND grantee = 'PUBLIC'`);
      assert.equal(privileges.rows[0].count, 0);
    });

    test("disabled capture and unreachable storage return 503 instead of success", async () => {
      process.env.LEAD_CAPTURE_ENABLED = "false";
      try {
        assert.equal(
          (await handleLeadSubmission(request(payload()))).status,
          503,
        );
      } finally {
        process.env.LEAD_CAPTURE_ENABLED = "true";
      }
      const unreachable = new URL(testDatabaseUrl!);
      unreachable.port = "1";
      process.env.DATABASE_URL = unreachable.toString();
      try {
        const result = await handleLeadSubmission(request(payload()));
        assert.equal(result.status, 503);
        assert.equal((await result.json()).ok, false);
      } finally {
        process.env.DATABASE_URL = testDatabaseUrl;
      }
    });
  },
);
