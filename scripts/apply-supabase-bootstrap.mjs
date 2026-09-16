/**
 * Aplica schema + migraciones + seeds en Supabase remoto.
 *
 * Requiere en .env.local (o variables de entorno):
 *   SUPABASE_DB_PASSWORD=...  (Database password del proyecto)
 *
 * Uso: node scripts/apply-supabase-bootstrap.mjs
 */
import { readFileSync, readdirSync } from "fs";
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
    "Faltan NEXT_PUBLIC_SUPABASE_URL en .env.local y SUPABASE_DB_PASSWORD (contraseña de DB en Supabase → Settings → Database)."
  );
  process.exit(1);
}

const poolerRegion = process.env.SUPABASE_POOLER_REGION || "sa-east-1";
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-${poolerRegion}.pooler.supabase.com:5432/postgres`;

const skipMigrations = new Set([
  "20260926_rls_membership.sql",
  "20260927_apr_rls_and_fk.sql",
  "20260928_storage_rls.sql",
]);

function migrationFiles() {
  const migDir = join(root, "supabase", "migrations");
  return [
    join(root, "supabase", "schema.sql"),
    ...readdirSync(migDir)
      .filter((f) => f.endsWith(".sql") && !skipMigrations.has(f))
      .sort()
      .map((f) => join(migDir, f)),
    join(root, "supabase", "bootstrap_open_rls_new_tables.sql"),
    join(root, "supabase", "bootstrap_data.sql"),
    join(root, "supabase", "bootstrap_repair.sql"),
  ];
}

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("Conectado a", projectRef);

  for (const path of migrationFiles()) {
    const file = path.split(/[/\\]/).pop();
    const sql = readFileSync(path, "utf8");
    console.log("Ejecutando:", file);
    try {
      await client.query(sql);
    } catch (e) {
      console.warn("  Aviso en", file, ":", e.message);
    }
  }

  await client.end();
  console.log("Bootstrap terminado.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
