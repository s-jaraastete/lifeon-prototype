/**
 * Crea usuarios en Supabase Auth y vincula organization_members + profiles.
 *
 * Requiere una de:
 *   SUPABASE_SERVICE_ROLE_KEY en .env.local
 * o
 *   SUPABASE_DB_PASSWORD en .env.local (actualiza auth_user_id si el usuario ya existe)
 *
 * También intenta signUp con anon si no hay service role (proyecto con registro abierto).
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function defaultAppPasswordFromEmail(email) {
  const prefix = email.trim().toLowerCase().slice(0, 4).padEnd(4, "0");
  return prefix.padEnd(6, "0");
}

const ACCOUNTS = [
  { email: "luis.godoy@safetyclub.cl", legacyId: "user_luis", memberId: "mem_user_luis", orgId: "org_luis", name: "Luis Godoy" },
  { email: "sergio.jara@safetyclub.cl", legacyId: "user_sergio", memberId: "mem_user_sergio", orgId: "org_sergio", name: "Sergio Jara" },
  { email: "aldo.berrios@safetyclub.cl", legacyId: "user_aldo", memberId: "mem_user_aldo", orgId: "org_aldo", name: "Aldo Berríos" },
  { email: "gonzalo.cabrera@safetyclub.cl", legacyId: "user_gonzalo_c", memberId: "mem_user_gonzalo_c", orgId: "org_gonzalo_c", name: "Gonzalo Cabrera" },
  { email: "gonzalo.beristain@safetyclub.cl", legacyId: "user_gonzalo_b", memberId: "mem_user_gonzalo_b", orgId: "org_gonzalo_b", name: "Gonzalo Beristain" },
  { email: "sergio.jara@lifeon.cl", legacyId: "demo_sergio", memberId: "mem_demo_sergio", orgId: "org_demo", name: "Sergio A. Jara Astete" },
  { email: "rene.ramos@safetyclub.cl", legacyId: "user_rene", memberId: "mem_user_rene", orgId: "org_rene", name: "René Ramos" },
  { email: "alex.ordenes@safetyclub.cl", legacyId: "user_alex", memberId: "mem_user_alex", orgId: "org_alex", name: "Alex Ordenes" },
  { email: "carlos.subiabre@safetyclub.cl", legacyId: "user_carlos", memberId: "mem_user_carlos", orgId: "org_carlos", name: "Carlos Subiabre" },
  { email: "pablo.yanez1@safetyclub.cl", legacyId: "user_pablo", memberId: "mem_user_pablo", orgId: "org_pablo", name: "Pablo Yañez" },
];

async function getPgClient() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = (url || "").replace("https://", "").replace(".supabase.co", "");
  if (!password || !ref) return null;
  const region = process.env.SUPABASE_POOLER_REGION || "sa-east-1";
  const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

async function linkMember(pgClient, account, authUserId) {
  const parts = account.name.split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";

  await pgClient.query(
    `UPDATE organization_members
     SET auth_user_id = $1::uuid, user_id = $2, email = $3, name = $4,
         first_name = $5, last_name = $6, role = 'Administrador', status = 'Activo'
     WHERE id = $7`,
    [authUserId, account.legacyId, account.email, account.name, firstName, lastName, account.memberId]
  );

  await pgClient.query(
    `INSERT INTO profiles (id, first_name, last_name)
     VALUES ($1::uuid, $2, $3)
     ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name`,
    [authUserId, firstName, lastName]
  );
}

async function createViaAdmin(admin, account) {
  const password = defaultAppPasswordFromEmail(account.email);
  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: account.name, legacy_user_id: account.legacyId, org_id: account.orgId },
  });
  if (error) {
    if (error.message?.includes("already") || error.status === 422) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list?.users?.find((u) => u.email?.toLowerCase() === account.email.toLowerCase());
      if (found) {
        await admin.auth.admin.updateUserById(found.id, { password });
        return found.id;
      }
    }
    throw error;
  }
  return data.user.id;
}

async function createViaSignUp(anon, account) {
  const password = defaultAppPasswordFromEmail(account.email);
  const { data, error } = await anon.auth.signUp({
    email: account.email,
    password,
    options: { data: { full_name: account.name, org_id: account.orgId } },
  });
  if (error) {
    if (error.message?.includes("already registered")) {
      const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
        email: account.email,
        password,
      });
      if (signInErr) throw signInErr;
      return signIn.user.id;
    }
    throw error;
  }
  if (!data.user?.id) throw new Error("signUp sin user id (¿confirmación email activa?)");
  return data.user.id;
}

async function main() {
  if (!url || !anonKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / ANON_KEY en .env.local");
    process.exit(1);
  }

  const adminClient = serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;
  const anonClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const pgClient = await getPgClient();

  if (!adminClient && !pgClient) {
    console.error(
      "Necesitas SUPABASE_SERVICE_ROLE_KEY o SUPABASE_DB_PASSWORD en .env.local para vincular usuarios."
    );
    process.exit(1);
  }

  for (const account of ACCOUNTS) {
    try {
      let authUserId;
      if (adminClient) {
        authUserId = await createViaAdmin(adminClient, account);
        console.log("OK (admin)", account.email, authUserId);
      } else {
        authUserId = await createViaSignUp(anonClient, account);
        console.log("OK (signUp)", account.email, authUserId);
      }

      if (pgClient && authUserId) {
        await linkMember(pgClient, account, authUserId);
        console.log("  → membership + profile vinculados");
      }
    } catch (e) {
      console.error("FAIL", account.email, e.message || e);
    }
  }

  if (pgClient) await pgClient.end();
  console.log("Listo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
