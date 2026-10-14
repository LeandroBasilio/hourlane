import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* CI uses explicit environment variables. */
}
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl)
  throw new Error(
    "TEST_DATABASE_URL is required for browser integration tests.",
  );
const testUrl = new URL(testDatabaseUrl);
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(testUrl.hostname) ||
  !/^\/hourlane[a-z0-9_]*_test$/i.test(decodeURIComponent(testUrl.pathname)) ||
  testDatabaseUrl === process.env.DATABASE_URL
)
  throw new Error("Unsafe test database configuration.");

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
          args: ["--no-sandbox"],
        }
      : {},
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      APP_ORIGIN: "http://127.0.0.1:3100",
      LEAD_CAPTURE_ENABLED: "true",
      SITE_LAUNCH_READY: "false",
      PRIVACY_NOTICE_VERSION: "2026-10-14-draft",
      RATE_LIMIT_SECRET: "browser-test-only-secret-not-for-production-2026",
    },
  },
});
