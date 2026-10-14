import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const databaseUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Set MIGRATION_DATABASE_URL or DATABASE_URL before migrating.");

const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 5000, max: 1 });
const directory = fileURLToPath(new URL("../db/migrations/", import.meta.url));
let client;
try {
  client = await pool.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(702180031)");
  await client.query("CREATE SCHEMA IF NOT EXISTS hourlane");
  await client.query("REVOKE ALL ON SCHEMA hourlane FROM PUBLIC");
  await client.query(`CREATE TABLE IF NOT EXISTS hourlane.schema_migrations (
    name text PRIMARY KEY, checksum char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
  )`);
  await client.query("REVOKE ALL ON hourlane.schema_migrations FROM PUBLIC");
  const files = (await readdir(directory)).filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
  for (const name of files) {
    const sql = await readFile(new URL(`../db/migrations/${name}`, import.meta.url), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await client.query("SELECT checksum FROM hourlane.schema_migrations WHERE name = $1", [name]);
    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) throw new Error("Applied migration checksum mismatch.");
      continue;
    }
    await client.query(sql);
    await client.query("INSERT INTO hourlane.schema_migrations (name, checksum) VALUES ($1, $2)", [name, checksum]);
  }
  await client.query("COMMIT");
  console.log("Database migrations are up to date.");
} catch {
  if (client) await client.query("ROLLBACK").catch(() => undefined);
  console.error("Migration failed. Check database access and migration history; no connection details were logged.");
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
