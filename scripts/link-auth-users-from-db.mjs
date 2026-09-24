/**
 * Vincula organization_members.auth_user_id desde auth.users (mismo email).
 * Requiere SUPABASE_DB_PASSWORD en .env.local.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const password = process.env.SUPABASE_DB_PASSWORD;
const ref = url.replace("https://", "").replace(".supabase.co", "");
if (!password || !ref) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_DB_PASSWORD");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const { rows } = await client.query(`
  UPDATE organization_members m
  SET auth_user_id = u.id
  FROM auth.users u
  WHERE m.auth_user_id IS NULL
    AND lower(m.email) = lower(u.email)
    AND u.deleted_at IS NULL
  RETURNING m.email, m.organization_id, m.auth_user_id::text
`);

console.log("Vinculados:", rows.length);
for (const r of rows) {
  console.log(" ", r.email, "→", r.organization_id, r.auth_user_id);
}

const missing = await client.query(`
  SELECT email, organization_id FROM organization_members
  WHERE auth_user_id IS NULL AND status IN ('Activo', 'Invitado')
  ORDER BY email
`);
if (missing.rows.length) {
  console.log("Sin usuario Auth (crear en dashboard o con service_role):");
  for (const r of missing.rows) console.log(" ", r.email, r.organization_id);
}

await client.end();
