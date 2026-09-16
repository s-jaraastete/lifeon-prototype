import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const supabaseDir = join(root, "supabase");
const migDir = join(supabaseDir, "migrations");

const skip = new Set([
  "20260926_rls_membership.sql",
  "20260927_apr_rls_and_fk.sql",
  "20260928_storage_rls.sql",
]);

const parts = [
  join(supabaseDir, "schema.sql"),
  ...readdirSync(migDir)
    .filter((f) => f.endsWith(".sql") && !skip.has(f))
    .sort()
    .map((f) => join(migDir, f)),
  join(supabaseDir, "bootstrap_open_rls_new_tables.sql"),
  join(supabaseDir, "bootstrap_data.sql"),
];

let out = "-- LifeOn: ejecutar en Supabase → SQL Editor (Run)\n-- Proyecto: gezcblnyteijkckabkyh\n\n";
for (const p of parts) {
  out += `\n-- ========== ${p.split(/[/\\]/).pop()} ==========\n`;
  out += readFileSync(p, "utf8");
  out += "\n";
}

writeFileSync(join(supabaseDir, "RUN_IN_SQL_EDITOR.sql"), out);
console.log("Written", join(supabaseDir, "RUN_IN_SQL_EDITOR.sql"), "bytes:", out.length);
