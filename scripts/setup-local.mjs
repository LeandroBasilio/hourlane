import { randomBytes } from "node:crypto";
import { access, writeFile } from "node:fs/promises";

for (const path of [".env", ".env.local"]) {
  try {
    await access(path);
    console.error("Local configuration already exists. Refusing to overwrite it.");
    process.exit(1);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const password = randomBytes(24).toString("hex");
const secret = randomBytes(32).toString("hex");
await writeFile(".env", `POSTGRES_PASSWORD=${password}\n`, { flag: "wx", mode: 0o600 });
await writeFile(".env.local", [
  `DATABASE_URL=postgresql://hourlane:${password}@127.0.0.1:54329/hourlane`,
  `TEST_DATABASE_URL=postgresql://hourlane:${password}@127.0.0.1:54329/hourlane_test`,
  "APP_ORIGIN=http://localhost:3000",
  `RATE_LIMIT_SECRET=${secret}`,
  "LEAD_CAPTURE_ENABLED=true",
  "SITE_LAUNCH_READY=false",
  "PRIVACY_NOTICE_VERSION=2026-10-14-draft",
  "",
].join("\n"), { flag: "wx", mode: 0o600 });
console.log("Local-only configuration created. Use fictional test data. No credentials were printed.");
