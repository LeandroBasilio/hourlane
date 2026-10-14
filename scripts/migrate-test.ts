const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error(
    "Set TEST_DATABASE_URL to a separate local hourlane…_test database.",
  );
const parsed = new URL(url);
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) ||
  !/^\/hourlane[a-z0-9_]*_test$/i.test(decodeURIComponent(parsed.pathname)) ||
  url === process.env.DATABASE_URL
) {
  throw new Error("Refusing to migrate an unsafe or shared test database.");
}
process.env.MIGRATION_DATABASE_URL = url;
await import("./migrate");
export {};
