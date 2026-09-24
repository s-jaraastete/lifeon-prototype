/**
 * Restablece una cuenta de prueba (purge + bootstrap) vía service role.
 * Uso: node scripts/run-test-account-reset.mjs sergio.jara@safetyclub.cl
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

loadEnvLocal();

const emailArg = (process.argv[2] || "sergio.jara@safetyclub.cl").trim().toLowerCase();

const ACCOUNTS = {
  "sergio.jara@safetyclub.cl": {
    id: "user_sergio",
    name: "Sergio Jara",
    email: "sergio.jara@safetyclub.cl",
    orgId: "org_sergio",
    orgName: "Constructora Horizonte SpA",
  },
};

const account = ACCOUNTS[emailArg];
if (!account) {
  console.error("Email no configurado en script:", emailArg);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan variables Supabase en .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function defaultPasswordFromEmail(email) {
  const local = email.split("@")[0] || "user";
  const prefix = local.replace(/[^a-z0-9]/gi, "").slice(0, 4).toLowerCase() || "user";
  return (prefix + "00").slice(0, 6);
}

async function findAuthUserIdByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function purge(orgId) {
  const tables = [
    ["document_deliveries", { organization_id: orgId }],
    ["organization_members", { organization_id: orgId }],
    ["positions", { organization_id: orgId }],
    ["subprocesses", { organization_id: orgId }],
    ["processes", { organization_id: orgId }],
    ["areas", { organization_id: orgId }],
    ["work_centers", { organization_id: orgId }],
    ["preventive_evidence", { organization_id: orgId }],
    ["preventive_activities", { organization_id: orgId }],
    ["preventive_plans", { organization_id: orgId }],
    ["technical_documents", { organization_id: orgId }],
  ];
  for (const [table, filter] of tables) {
    let q = admin.from(table).delete();
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    const { error } = await q;
    if (error && !error.message.includes("does not exist")) {
      console.warn("warn", table, error.message);
    }
  }
  await admin.from("preventive_docs").delete().like("id", `${orgId}_%`);
  await admin
    .from("iper_matrices")
    .delete()
    .or(`organization_id.eq.${orgId},id.like.${orgId}_%`);
  await admin.from("org_structure").delete().in("id", [`structure_${orgId}`, orgId]);
  await admin
    .from("organization_preferences")
    .delete()
    .or(`id.eq.${orgId},organization_id.eq.${orgId}`);
  await admin
    .from("organizations")
    .update({ logo_url: null, logo_path: null })
    .eq("id", orgId);
}

async function reseed() {
  const orgId = account.orgId;
  await admin.from("organizations").upsert({
    id: orgId,
    name: account.orgName,
    industry: "Construcción",
    size: "51-200",
    status: "Activo",
    logo_url: null,
    logo_path: null,
  });
  await admin.from("organization_preferences").upsert({
    id: orgId,
    organization_id: orgId,
    preferences: {
      onboardingCompleted: false,
      organizationLogo: null,
      profilePhoto: null,
    },
  });
  await admin.from("preventive_plans").upsert({
    id: `plan_${orgId}`,
    organization_id: orgId,
    name: "Programa Anual",
    status: "Activo",
  });

  const password = defaultPasswordFromEmail(account.email);
  let authUserId = await findAuthUserIdByEmail(account.email);
  if (!authUserId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "createUser");
    authUserId = created.user.id;
  } else {
    await admin.auth.admin.updateUserById(authUserId, { password });
  }

  const firstName = account.name.split(" ")[0];
  const lastName = account.name.split(" ").slice(1).join(" ") || "";
  await admin.from("organization_members").upsert({
    id: `mem_${account.id}`,
    organization_id: orgId,
    auth_user_id: authUserId,
    user_id: account.id,
    email: account.email,
    name: account.name,
    first_name: firstName,
    last_name: lastName,
    role: "Administrador",
    status: "Activo",
    permissions: {},
  });
  await admin.from("profiles").upsert({
    id: authUserId,
    first_name: firstName,
    last_name: lastName || null,
    avatar_path: null,
  });
  console.log("Listo. Contraseña de acceso:", password);
}

async function main() {
  console.log("Restableciendo", account.email, "…");
  await purge(account.orgId);
  await reseed();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
