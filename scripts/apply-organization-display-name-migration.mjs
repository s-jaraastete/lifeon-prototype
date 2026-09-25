/**
 * Aplica supabase/migrations/20261002_organization_display_name.sql
 * y alinea organizations.name con organization_preferences.organizationName.
 * Uso: node scripts/apply-organization-display-name-migration.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv6first");

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
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_DB_PASSWORD en .env.local");
  process.exit(1);
}

const poolerRegion = process.env.SUPABASE_POOLER_REGION || "sa-east-1";
const encodedPassword = encodeURIComponent(password);
const connectionCandidates = [
  process.env.DATABASE_URL,
  `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${poolerRegion}.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${poolerRegion}.pooler.supabase.com:6543/postgres`,
].filter(Boolean);

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

  const path = join(root, "supabase", "migrations", "20261002_organization_display_name.sql");
  const sql = readFileSync(path, "utf8");
  console.log("Ejecutando: 20261002_organization_display_name.sql");
  await client.query(sql);

  const sync = await client.query(`
    UPDATE organizations o
    SET name = trim(op.preferences->>'organizationName')
    FROM organization_preferences op
    WHERE op.id = CASE WHEN o.id = 'org_demo' THEN 'default_org' ELSE o.id END
      AND NULLIF(trim(op.preferences->>'organizationName'), '') IS NOT NULL
      AND trim(o.name) IS DISTINCT FROM trim(op.preferences->>'organizationName')
    RETURNING o.id, o.name
  `);
  if (sync.rowCount > 0) {
    console.log("Organizaciones alineadas con preferencias:", sync.rows);
  } else {
    console.log("No había organizations.name desalineados con preferencias.");
  }

  const check = await client.query(`
    SELECT
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'organization_display_name') AS has_display_name_fn,
      public.organization_display_name('org_luis') AS org_luis_display_name
  `);
  console.log("Verificación:", check.rows[0]);

  await client.end();
  console.log("Migración organization_display_name aplicada.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
