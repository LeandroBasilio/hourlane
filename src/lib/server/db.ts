import "server-only";
import { Pool } from "pg";

const globalForDatabase = globalThis as unknown as { hourlanePools?: Map<string, Pool> };
const pools = globalForDatabase.hourlanePools ??= new Map<string, Pool>();

export function getDatabasePool(databaseUrl: string): Pool {
  let pool = pools.get(databaseUrl);
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 4,
      connectionTimeoutMillis: 2000,
      idleTimeoutMillis: 30_000,
      statement_timeout: 5000,
      application_name: "hourlane-lead-capture",
    });
    // Never log provider error objects: they can contain connection details or SQL values.
    pool.on("error", () => console.error("hourlane_database_idle_connection_error"));
    pools.set(databaseUrl, pool);
  }
  return pool;
}

export async function closeDatabasePools(): Promise<void> {
  await Promise.all([...pools.values()].map((pool) => pool.end()));
  pools.clear();
}
