import { Pool } from "pg";
import { z } from "zod";

const usage = `Usage:
  npm run leads -- export --id UUID --confirm-pii
  npm run leads -- export --all --confirm-pii
  npm run leads -- close --id UUID --confirm
  npm run leads -- delete --id UUID --confirm
  npm run leads -- purge --confirm
Export writes personal data as JSON to stdout; handle the output securely.
Close schedules deletion 90 days from closure. Purge removes only due, closed leads
and expired rate-limit buckets. Use OPERATOR_DATABASE_URL or DATABASE_URL.`;

const [command, ...arguments_] = process.argv.slice(2);
const allowed = new Set(["--id", "--confirm", "--confirm-pii", "--all"]);
const options = new Map<string, string | boolean>();
let invalid = false;
for (let index = 0; index < arguments_.length; index++) {
  const argument = arguments_[index];
  if (!allowed.has(argument) || options.has(argument)) { invalid = true; break; }
  if (argument === "--id") {
    const id = arguments_[++index];
    if (!z.string().uuid().safeParse(id).success) { invalid = true; break; }
    options.set(argument, id);
  } else options.set(argument, true);
}
const id = options.get("--id");
const isExport = command === "export" && options.has("--confirm-pii") &&
  Boolean(id) !== options.has("--all") && !options.has("--confirm");
const isIdMutation = ["close", "delete"].includes(command) && Boolean(id) && options.has("--confirm") &&
  !options.has("--all") && !options.has("--confirm-pii");
const isPurge = command === "purge" && options.size === 1 && options.has("--confirm");
if (invalid || !(isExport || isIdMutation || isPurge)) {
  console.error(usage);
  process.exitCode = 1;
} else {
  const connectionString = process.env.OPERATOR_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Set OPERATOR_DATABASE_URL or DATABASE_URL first.");
    process.exitCode = 1;
  } else {
    const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000, statement_timeout: 10_000 });
    try {
      if (isExport) {
        const result = await pool.query(
          `SELECT id, name, email, company, industry, challenge, created_at,
           privacy_notice_version, status, closed_at, delete_after
           FROM hourlane.leads ${id ? "WHERE id = $1" : ""} ORDER BY created_at`, id ? [id] : [],
        );
        process.stdout.write(`${JSON.stringify(result.rows, null, 2)}\n`);
      } else if (command === "close") {
        const result = await pool.query(
          `UPDATE hourlane.leads SET status = 'closed', closed_at = clock_timestamp(),
           delete_after = clock_timestamp() + interval '90 days' WHERE id = $1 AND status = 'open'`, [id],
        );
        console.log(`Closed ${result.rowCount} open lead(s).`);
      } else if (command === "delete") {
        const result = await pool.query("DELETE FROM hourlane.leads WHERE id = $1", [id]);
        console.log(`Deleted ${result.rowCount} lead(s).`);
      } else {
        const result = await pool.query("DELETE FROM hourlane.leads WHERE status = 'closed' AND delete_after <= clock_timestamp()");
        await pool.query("DELETE FROM hourlane.rate_limit_buckets WHERE expires_at <= clock_timestamp()");
        console.log(`Purged ${result.rowCount} due lead(s) and expired abuse-protection records.`);
      }
    } catch {
      console.error("Lead operation failed. Check database access; personal data and connection details were not logged.");
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  }
}
