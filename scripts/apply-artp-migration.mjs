/**
 * Aplica migraciones ARTP en supabase/migrations/
 * Uso:
 *   node scripts/apply-artp-migration.mjs           # 20261006 + 20261007 (proyectos ya con ARTP base)
 *   node scripts/apply-artp-migration.mjs --full    # incluye 20261005 (instalación inicial)
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

  const migrationFiles = process.argv.includes("--full")
    ? [
        "20261005_artp.sql",
        "20261006_artp_planning_snapshot.sql",
        "20261007_artp_planning_detail_publish.sql",
      ]
    : [
        "20261006_artp_planning_snapshot.sql",
        "20261007_artp_planning_detail_publish.sql",
        "20261008_artp_signature_deliveries.sql",
        "20261009_artp_signature_tracking.sql",
        "20261010_artp_delete_and_signature_dedupe.sql",
        "20261011_artp_clone_version.sql",
      ];

  for (const file of migrationFiles) {
    const path = join(root, "supabase", "migrations", file);
    const sql = readFileSync(path, "utf8");
    console.log("Ejecutando:", file);
    await client.query(sql);
  }

  const check = await client.query(`
    SELECT
      to_regclass('public.artp_documents')::text AS artp_documents,
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'publish_artp_version') AS has_publish_rpc,
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'submit_artp_version_for_signatures') AS has_submit_rpc,
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_artp_version_detail') AS has_detail_rpc,
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_artp_version_signature_deliveries') AS has_artp_delivery_sync
  `);
  console.log("Verificación:", check.rows[0]);

  await client.end();
  console.log("Migraciones ARTP aplicadas.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
