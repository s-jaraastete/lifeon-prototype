/**
 * Tras login con Supabase Auth, comprueba lectura tenant-scoped (RLS membresía).
 * Uso: node scripts/verify-authenticated-tenant-read.mjs [email] [password]
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
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

const email = process.argv[2] || "sergio.jara@safetyclub.cl";
const password = process.argv[3] || "serg";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const ref = (url || "").replace("https://", "").replace(".supabase.co", "");

const supabase = createClient(url, anonKey, { auth: { persistSession: false } });

const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (authError || !authData.user) {
  console.error("Login falló:", authError?.message);
  process.exit(1);
}
console.log("Login OK:", authData.user.id);

if (dbPassword) {
  const pgClient = new pg.Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword)}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();
  const member = await pgClient.query(
    `SELECT organization_id, auth_user_id::text, status, role
     FROM organization_members WHERE lower(email) = lower($1) LIMIT 1`,
    [email]
  );
  console.log("organization_members:", member.rows[0] || "(sin fila)");
  await pgClient.end();
}

const { data: matrices, error: readError } = await supabase
  .from("iper_matrices")
  .select("id, title, organization_id")
  .like("id", "org_sergio_%")
  .limit(5);

if (readError) {
  console.error("Lectura iper_matrices falló:", readError.message);
  process.exit(1);
}

console.log("iper_matrices (muestra):", matrices?.length ?? 0, "filas");
if (matrices?.length) {
  console.log("  ejemplo:", matrices[0].id, "-", matrices[0].title?.slice(0, 40));
}
console.log("OK: sesión autenticada puede leer datos del tenant.");
