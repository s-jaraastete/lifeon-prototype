/**
 * Diagnóstico de restablecimiento de cuenta de prueba.
 * Uso: node scripts/test-reset-account.mjs sergio.jara@safetyclub.cl
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

const email = (process.argv[2] || "sergio.jara@safetyclub.cl").trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ACCOUNTS = {
  "sergio.jara@safetyclub.cl": { orgId: "org_sergio", id: "user_sergio", name: "Sergio Jara" },
};

const account = ACCOUNTS[email];
if (!account) {
  console.error("Email no soportado en script:", email);
  process.exit(1);
}

async function step(label, fn) {
  try {
    await fn();
    console.log("OK:", label);
  } catch (e) {
    console.error("FAIL:", label, e instanceof Error ? e.message : e);
    throw e;
  }
}

async function del(table, filter) {
  let q = admin.from(table).delete();
  for (const [col, val] of Object.entries(filter)) {
    q = q.eq(col, val);
  }
  const { error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  const orgId = account.orgId;
  console.log("Reset diagnóstico para", email, "org", orgId);

  await step("document_deliveries", () => del("document_deliveries", { organization_id: orgId }));
  await step("organization_members", () => del("organization_members", { organization_id: orgId }));
  await step("iper_matrices", () =>
    admin
      .from("iper_matrices")
      .delete()
      .or(`organization_id.eq.${orgId},id.like.${orgId}_%`)
      .then(({ error }) => {
        if (error) throw new Error(error.message);
      })
  );

  console.log("Diagnóstico parcial completado (sin reseed).");
}

main().catch(() => process.exit(1));
