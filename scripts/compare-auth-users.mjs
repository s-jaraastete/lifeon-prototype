import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, ".env.local"), "utf8");
for (const line of raw.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  const v = t.slice(i + 1).trim();
  if (!process.env[k]) process.env[k] = v;
}

const ref = process.env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");
const client = new pg.Client({
  connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const cols = await client.query(
  `SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema = 'auth' AND table_name = 'users'
   ORDER BY ordinal_position`
);
console.log("columns", cols.rows.length);

const users = await client.query(`SELECT * FROM auth.users ORDER BY created_at`);
for (const row of users.rows) {
  console.log("\n===", row.email, "===");
  for (const c of cols.rows) {
    const name = c.column_name;
    const val = row[name];
    if (val === null || val === "" || val === false) continue;
    if (name === "encrypted_password") {
      console.log(name, "(set, len", String(val).length, ")");
      continue;
    }
    console.log(name, val);
  }
}

await client.end();
