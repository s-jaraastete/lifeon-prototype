/**
 * Crea entregas móviles pendientes para todas las versiones ARTP en en_revision.
 * Uso: node scripts/sync-artp-signature-deliveries.mjs
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
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_DB_PASSWORD");
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

const client = await connectClient();
const versions = await client.query(
  "SELECT id FROM artp_versions WHERE status = 'en_revision'"
);
for (const row of versions.rows) {
  await client.query("SELECT public.sync_artp_version_signature_deliveries($1)", [
    row.id,
  ]);
  console.log("Sincronizado:", row.id);
}
const pending = await client.query(
  `SELECT count(*)::int AS n FROM document_deliveries
   WHERE source_type = 'artp'
     AND status IN ('pendiente_revision', 'pendiente_firma')`
);
console.log("Entregas ARTP pendientes:", pending.rows[0].n);
await client.end();
