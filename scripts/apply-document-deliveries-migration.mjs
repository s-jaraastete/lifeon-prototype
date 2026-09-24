/**
 * Aplica solo supabase/migrations/20261001_document_deliveries.sql
 * Uso: node scripts/apply-document-deliveries-migration.mjs
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
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_DB_PASSWORD en .env.local");
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

  const path = join(root, "supabase", "migrations", "20261001_document_deliveries.sql");
  const sql = readFileSync(path, "utf8");
  console.log("Ejecutando: 20261001_document_deliveries.sql");
  await client.query(sql);

  const check = await client.query(`
    SELECT
      to_regclass('public.document_deliveries')::text AS document_deliveries_table,
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_my_irl') AS has_get_my_irl,
      EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'acknowledgement-evidence') AS has_ack_bucket
  `);
  console.log("Verificación:", check.rows[0]);

  await client.end();
  console.log("Migración document_deliveries aplicada.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
