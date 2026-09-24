import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  try {
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
  } catch {
    /* noop */
  }
}

loadEnvLocal();

const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
  .replace("https://", "")
  .replace(".supabase.co", "")
  .trim();
const password = process.env.SUPABASE_DB_PASSWORD;
if (!projectRef || !password) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_DB_PASSWORD en .env.local");
  process.exit(1);
}

const poolerRegion = process.env.SUPABASE_POOLER_REGION || "sa-east-1";
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-${poolerRegion}.pooler.supabase.com:5432/postgres`;

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const noRls = await client.query(`
  SELECT c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  ORDER BY 1`);

const openPolicies = await client.query(`
  SELECT tablename, policyname, roles::text AS roles, qual::text AS qual, with_check::text AS with_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      roles::text LIKE '%anon%'
      OR qual = 'true'
      OR with_check = 'true'
    )
  ORDER BY tablename, policyname`);

console.log("TABLES_WITHOUT_RLS:", noRls.rows);
console.log("OPEN_POLICIES:", openPolicies.rows);

await client.end();
