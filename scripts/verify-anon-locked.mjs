/**
 * Verifica que la anon key no pueda leer tablas sensibles (tras cerrar RLS).
 * Uso: node scripts/verify-anon-locked.mjs
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const client = createClient(url, anonKey, { auth: { persistSession: false } });

const tables = ["iper_matrices", "organization_members", "apr_ai_usage"];

let failed = false;
for (const table of tables) {
  const { data, error } = await client.from(table).select("id").limit(1);
  const leaked = !error && Array.isArray(data) && data.length > 0;
  const denied =
    error &&
    (error.code === "42501" ||
      error.message?.includes("permission denied") ||
      error.message?.includes("row-level security"));
  const ok = denied || (!leaked && (data?.length === 0 || error));
  console.log(table, ok ? "OK (sin acceso anon)" : "FALLO", error?.message ?? `rows=${data?.length ?? 0}`);
  if (!ok) failed = true;
}

process.exit(failed ? 1 : 0);
