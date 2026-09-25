/**
 * Alinea cuentas de prueba @safetyclub.cl con el login web:
 * - Contraseña Auth = prefijo de 4 letras + "00" (ver lib/auth/defaultAppPassword.ts)
 * - organization_members.auth_user_id vinculado al UUID de Auth
 *
 * Uso: node scripts/sync-test-account-auth.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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

function defaultAppPasswordFromEmail(email) {
  const prefix = email.trim().toLowerCase().slice(0, 4).padEnd(4, "0");
  return prefix.padEnd(6, "0");
}

loadEnvLocal();

const ACCOUNTS = [
  { email: "luis.godoy@safetyclub.cl", legacyId: "user_luis", memberId: "mem_user_luis", orgId: "org_luis", name: "Luis Godoy" },
  { email: "sergio.jara@safetyclub.cl", legacyId: "user_sergio", memberId: "mem_user_sergio", orgId: "org_sergio", name: "Sergio Jara" },
  { email: "aldo.berrios@safetyclub.cl", legacyId: "user_aldo", memberId: "mem_user_aldo", orgId: "org_aldo", name: "Aldo Berríos" },
  { email: "gonzalo.cabrera@safetyclub.cl", legacyId: "user_gonzalo_c", memberId: "mem_user_gonzalo_c", orgId: "org_gonzalo_c", name: "Gonzalo Cabrera" },
  { email: "gonzalo.beristain@safetyclub.cl", legacyId: "user_gonzalo_b", memberId: "mem_user_gonzalo_b", orgId: "org_gonzalo_b", name: "Gonzalo Beristain" },
  { email: "rene.ramos@safetyclub.cl", legacyId: "user_rene", memberId: "mem_user_rene", orgId: "org_rene", name: "René Ramos" },
  { email: "alex.ordenes@safetyclub.cl", legacyId: "user_alex", memberId: "mem_user_alex", orgId: "org_alex", name: "Alex Ordenes" },
  { email: "carlos.subiabre@safetyclub.cl", legacyId: "user_carlos", memberId: "mem_user_carlos", orgId: "org_carlos", name: "Carlos Subiabre" },
  {
    email: "pablo.yanez1@safetyclub.cl",
    legacyId: "user_pablo",
    memberId: "mem_user_pablo",
    orgId: "org_pablo",
    name: "Pablo Yañez",
    orgName: "Yañez Prevención SpA",
    industry: "Construcción",
    size: "1-20",
  },
  { email: "sergio.jara@lifeon.cl", legacyId: "demo_sergio", memberId: "mem_demo_sergio", orgId: "org_demo", name: "Sergio A. Jara Astete" },
];

async function findAuthUserIdByEmail(admin, email) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function ensureOrgBootstrap(admin, account) {
  if (!account.orgName) return;
  const industry = account.industry || "Construcción";
  const size = account.size || "1-20";
  await admin.from("organizations").upsert({
    id: account.orgId,
    name: account.orgName,
    industry,
    size,
    status: "Activo",
    logo_url: null,
    logo_path: null,
  });
  await admin.from("organization_preferences").upsert({
    id: account.orgId,
    organization_id: account.orgId,
    preferences: {
      onboardingCompleted: false,
      organizationLogo: null,
      profilePhoto: null,
    },
  });
  await admin.from("preventive_plans").upsert({
    id: `plan_${account.orgId}`,
    organization_id: account.orgId,
    name: "Programa Anual",
    status: "Activo",
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  for (const account of ACCOUNTS) {
    const email = account.email.trim().toLowerCase();
    const password = defaultAppPasswordFromEmail(email);
    let authUserId = await findAuthUserIdByEmail(admin, email);

    if (!authUserId) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !created.user) {
        console.error("FAIL create", email, error?.message);
        continue;
      }
      authUserId = created.user.id;
      console.log("CREATED", email, authUserId);
    } else {
      const { error } = await admin.auth.admin.updateUserById(authUserId, { password });
      if (error) {
        console.error("FAIL password", email, error.message);
        continue;
      }
      console.log("PASSWORD", email, "→", password.replace(/./g, "*"));
    }

    await ensureOrgBootstrap(admin, account);

    const parts = account.name.split(" ");
    const firstName = parts[0] || account.name;
    const lastName = parts.slice(1).join(" ") || "";

    const { error: memberErr } = await admin.from("organization_members").upsert({
      id: account.memberId,
      organization_id: account.orgId,
      auth_user_id: authUserId,
      user_id: account.legacyId,
      email,
      name: account.name,
      first_name: firstName,
      last_name: lastName,
      role: "Administrador",
      status: "Activo",
      permissions: {},
      updated_at: new Date().toISOString(),
    });

    if (memberErr) {
      console.error("FAIL member", email, memberErr.message);
      continue;
    }

    await admin.from("profiles").upsert({
      id: authUserId,
      first_name: firstName,
      last_name: lastName || null,
    });

    console.log("LINKED", email, account.memberId);
  }

  console.log("Listo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
