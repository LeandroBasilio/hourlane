import "server-only";

export interface LeadCaptureConfig {
  databaseUrl: string;
  origin: string;
  rateLimitSecret: string;
  trustVercelProxy: boolean;
  privacyNoticeVersion: string;
}

export function isLoopbackHost(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}

/** No connection is opened here: unavailable or incomplete setup always disables capture. */
export function getLeadCaptureConfig(): LeadCaptureConfig | null {
  if (process.env.LEAD_CAPTURE_ENABLED !== "true") return null;
  const databaseUrl = process.env.DATABASE_URL;
  const origin = process.env.APP_ORIGIN;
  const rateLimitSecret = process.env.RATE_LIMIT_SECRET;
  if (!databaseUrl || !origin || !rateLimitSecret || rateLimitSecret.length < 32) return null;

  try {
    const database = new URL(databaseUrl);
    const app = new URL(origin);
    if (!["postgres:", "postgresql:"].includes(database.protocol)) return null;
    if (app.origin !== origin || app.username || app.password) return null;
    const loopback = isLoopbackHost(app.hostname);
    if (app.protocol !== "https:" && !(loopback && app.protocol === "http:")) return null;
    const privacyNoticeVersion = process.env.PRIVACY_NOTICE_VERSION || "2026-10-14-draft";
    if (!/^[a-zA-Z0-9._-]{1,80}$/.test(privacyNoticeVersion)) return null;
    // Public collection requires an explicit launch decision, including in preview deployments.
    if (!loopback && (process.env.SITE_LAUNCH_READY !== "true" || /draft/i.test(privacyNoticeVersion))) {
      return null;
    }
    if (process.env.TRUST_PROXY &&
      !(process.env.TRUST_PROXY === "vercel" && process.env.VERCEL === "1")) return null;
    return {
      databaseUrl,
      origin,
      rateLimitSecret,
      trustVercelProxy: process.env.TRUST_PROXY === "vercel" && process.env.VERCEL === "1",
      privacyNoticeVersion,
    };
  } catch {
    return null;
  }
}

export function isLeadCaptureConfigured(): boolean {
  return getLeadCaptureConfig() !== null;
}
