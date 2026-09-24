import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const supabaseDir = join(root, "supabase");
const migDir = join(supabaseDir, "migrations");

const parts = [
  join(supabaseDir, "schema.sql"),
  ...readdirSync(migDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(migDir, f)),
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
