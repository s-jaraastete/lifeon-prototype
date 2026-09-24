/**
 * Aplica solo migraciones de seguridad (RLS) en Supabase remoto.
 *
 * Requiere SUPABASE_DB_PASSWORD en .env.local (o DATABASE_URL).
 * Uso: node scripts/apply-security-migrations.mjs
 */
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
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_DB_PASSWORD en .env.local"
  );
  process.exit(1);
}

const poolerRegion = process.env.SUPABASE_POOLER_REGION || "sa-east-1";
const encodedPassword = encodeURIComponent(password);
const connectionCandidates = [
  process.env.DATABASE_URL,
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${poolerRegion}.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${poolerRegion}.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
].filter(Boolean);

const securityFiles = [
  "20260926_rls_membership.sql",
  "20260927_apr_rls_and_fk.sql",
  "20260928_storage_rls.sql",
  "20260930_lock_public_rls.sql",
  "20260931_advisor_remediation.sql",
].map((f) => join(root, "supabase", "migrations", f));

async function connectClient() {
  let lastError;
  for (const connectionString of connectionCandidates) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await client.connect();
      return client;
    } catch (e) {
      lastError = e;
      await client.end().catch(() => {});
    }
  }
  throw lastError;
}

async function main() {
  const client = await connectClient();
  console.log("Conectado a", projectRef);

  for (const path of securityFiles) {
    const file = path.split(/[/\\]/).pop();
    const sql = readFileSync(path, "utf8");
    console.log("Ejecutando:", file);
    try {
      await client.query(sql);
    } catch (e) {
      console.warn("  Aviso en", file, ":", e.message);
    }
  }

  const noRls = await client.query(`
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
    ORDER BY 1`);

  const openAnon = await client.query(`
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (roles::text LIKE '%anon%' AND (qual = 'true' OR with_check = 'true'))
    ORDER BY 1`);

  console.log("Tablas sin RLS:", noRls.rows.length ? noRls.rows : "ninguna");
  console.log("Políticas anon abiertas:", openAnon.rows.length ? openAnon.rows : "ninguna");

  await client.end();
  console.log("Migraciones de seguridad aplicadas.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
