import assert from "node:assert/strict";
import { test } from "node:test";
import { leadFormSchema, leadSubmissionSchema } from "../src/lib/leads/schema";
import { getLeadCaptureConfig } from "../src/lib/server/config";

const valid = { name: "Li", email: "TEAM@example.test", company: "Testbetrieb", industry: "shk", challenge: "Anfragen zuverlässig zuordnen." };

test("schema normalizes inputs and drops unknown fields without requiring two name words", () => {
  const result = leadFormSchema.parse({ ...valid, name: "  Li  ", company: " Test   Betrieb ", extra: "discard" });
  assert.equal(result.name, "Li");
  assert.equal(result.company, "Test Betrieb");
  assert.equal(result.email, "team@example.test");
  assert.equal("extra" in result, false);
  assert.equal(leadFormSchema.parse({ ...valid, industry: undefined }).industry, "");
});

test("schema validates lengths, enums, control characters, and request identifiers", () => {
  for (const change of [
    { name: "x" }, { email: "invalid" }, { company: "x" }, { industry: "invalid" },
    { challenge: "short" }, { challenge: "x".repeat(2001) }, { challenge: "Control\u0000character" },
  ]) assert.equal(leadFormSchema.safeParse({ ...valid, ...change }).success, false);
  assert.equal(leadSubmissionSchema.safeParse({ ...valid, requestId: "not-an-id" }).success, false);
});

test("configuration is fail-closed and public capture needs explicit legal readiness", () => {
  const names = ["DATABASE_URL", "APP_ORIGIN", "RATE_LIMIT_SECRET", "LEAD_CAPTURE_ENABLED", "TRUST_PROXY", "VERCEL", "SITE_LAUNCH_READY", "PRIVACY_NOTICE_VERSION"];
  const saved = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    assert.equal(getLeadCaptureConfig(), null);
    Object.assign(process.env, {
      DATABASE_URL: "postgresql://localhost/hourlane_test", APP_ORIGIN: "http://localhost:3000",
      RATE_LIMIT_SECRET: "unit-test-only-secret-32-characters-long", LEAD_CAPTURE_ENABLED: "true",
    });
    assert.ok(getLeadCaptureConfig());
    process.env.APP_ORIGIN = "https://hourlane.example";
    assert.equal(getLeadCaptureConfig(), null);
    process.env.SITE_LAUNCH_READY = "true";
    assert.equal(getLeadCaptureConfig(), null);
    process.env.PRIVACY_NOTICE_VERSION = "2026-10-14";
    assert.ok(getLeadCaptureConfig());
    process.env.TRUST_PROXY = "vercel";
    assert.equal(getLeadCaptureConfig(), null);
    process.env.VERCEL = "1";
    assert.equal(getLeadCaptureConfig()?.trustVercelProxy, true);
    process.env.RATE_LIMIT_SECRET = "short";
    assert.equal(getLeadCaptureConfig(), null);
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
