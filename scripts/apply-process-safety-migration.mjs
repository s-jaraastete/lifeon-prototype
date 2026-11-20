/**
 * Aplica la migración de Seguridad de Procesos (supabase/migrations/20261012_process_safety.sql).
 * Uso: node scripts/apply-process-safety-migration.mjs
 */
import { readFileSync } from "fs";
import { join } from "path";
import { connectSupabaseDb, root } from "./lib/pgConnect.mjs";

const client = await connectSupabaseDb();
const sql = readFileSync(join(root, "supabase", "migrations", "20261012_process_safety.sql"), "utf8");
try {
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Migración revertida:", e.message || e);
  await client.end();
  process.exit(1);
}
await client.query("NOTIFY pgrst, 'reload schema'");
const check = await client.query(`
  SELECT
    to_regclass('public.ps_activities')::text AS ps_activities,
    to_regclass('public.ps_progress_log')::text AS ps_progress_log,
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ps_activities_progress_log') AS progress_trigger,
    (SELECT count(*) FROM pg_policies WHERE tablename IN ('ps_activities', 'ps_progress_log'))::int AS policies
`);
console.log("Verificación:", check.rows[0]);
await client.end();
