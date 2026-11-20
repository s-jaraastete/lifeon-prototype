// Conexión pg a Supabase desde .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD), probando directo y pooler.
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv6first");

export const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

try {
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const t = line.trim();
    const i = t.indexOf("=");
    if (!t || t.startsWith("#") || i === -1) continue;
    const k = t.slice(0, i).trim();
    if (!process.env[k]) process.env[k] = t.slice(i + 1).trim();
  }
} catch {
  /* noop */
}

export async function connectSupabaseDb() {
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace("https://", "")
    .replace(".supabase.co", "")
    .trim();
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!projectRef || !password) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_DB_PASSWORD en .env.local");
  }
  const region = process.env.SUPABASE_POOLER_REGION || "sa-east-1";
  const pw = encodeURIComponent(password);
  const candidates = [
    process.env.DATABASE_URL,
    `postgresql://postgres:${pw}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${pw}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${projectRef}:${pw}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
  ].filter(Boolean);

  let lastError;
  for (const connectionString of candidates) {
    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
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
