/**
 * Diagnóstico aproximado de hallazgos típicos del Security Advisor (Splinter).
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

const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
  .replace("https://", "")
  .replace(".supabase.co", "")
  .trim();
const password = process.env.SUPABASE_DB_PASSWORD;
if (!ref || !password) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_DB_PASSWORD");
  process.exit(1);
}

const region = process.env.SUPABASE_POOLER_REGION || "sa-east-1";
const encodedPassword = encodeURIComponent(password);
const connectionCandidates = [
  process.env.DATABASE_URL,
  `postgresql://postgres.${ref}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodedPassword}@db.${ref}.supabase.co:5432/postgres`,
].filter(Boolean);

let client;
let lastError;
for (const connectionString of connectionCandidates) {
  const candidate = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await candidate.connect();
    client = candidate;
    break;
  } catch (e) {
    lastError = e;
    await candidate.end().catch(() => {});
  }
}
if (!client) throw lastError;

function section(title) {
  console.log("\n===", title, "===");
}

// 0013 rls disabled
section("0013_rls_disabled_in_public");
const noRls = await client.query(`
  SELECT c.relname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  ORDER BY 1`);
console.log(noRls.rows.length ? noRls.rows : "ninguna");

// 0008 rls enabled no policy
section("0008_rls_enabled_no_policy");
const noPolicy = await client.query(`
  SELECT c.relname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
    AND NOT EXISTS (
      SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
    )
  ORDER BY 1`);
console.log(noPolicy.rows.length ? noPolicy.rows : "ninguna");

// 0006 multiple permissive policies (same role + action)
section("0006_multiple_permissive_policies (muestra)");
const multi = await client.query(`
  SELECT tablename, cmd, roles::text, count(*) AS n
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename, cmd, roles
  HAVING count(*) > 1
  ORDER BY n DESC, tablename
  LIMIT 20`);
console.log(multi.rows);

// 0024 permissive always true
section("0024_permissive_rls_policy (USING/WITH CHECK true)");
const permissive = await client.query(`
  SELECT tablename, policyname, roles::text, qual::text, with_check::text
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual = 'true' OR with_check = 'true')
  ORDER BY tablename`);
console.log(permissive.rows.length ? permissive.rows : "ninguna");

// 0003 auth_rls_initplan (auth.uid() without select wrapper) - heuristic
section("0003_auth_rls_initplan (policies con auth.uid sin subselect)");
const initplan = await client.query(`
  SELECT tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      qual::text LIKE '%auth.uid()%'
      AND qual::text NOT LIKE '%(select auth.uid())%'
      OR with_check::text LIKE '%auth.uid()%'
      AND with_check::text NOT LIKE '%(select auth.uid())%'
    )
  ORDER BY tablename`);
console.log(initplan.rows);

// 0011 function search_path
section("0011_function_search_path_mutable (public funcs)");
const fnPath = await client.query(`
  SELECT p.proname,
         pg_get_function_identity_arguments(p.oid) AS args,
         p.proconfig
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND (
      p.proconfig IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
      )
    )
  ORDER BY 1`);
console.log(fnPath.rows);

// 0001 unindexed foreign keys (public)
section("0001_unindexed_foreign_keys (muestra)");
const unindexed = await client.query(`
  SELECT
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS foreign_table
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
  JOIN pg_namespace n ON n.oid = c.connamespace
  WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = c.conrelid
        AND a.attnum = ANY (i.indkey)
    )
  ORDER BY 1, 2
  LIMIT 30`);
console.log(unindexed.rows);

// storage public buckets
section("0025_public_bucket (buckets public=true)");
const buckets = await client.query(`
  SELECT id, name, public FROM storage.buckets WHERE public = true ORDER BY id`);
console.log(buckets.rows);

// storage RLS on objects
section("storage.objects policies count");
const storagePol = await client.query(`
  SELECT count(*)::int AS n FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'`);
console.log(storagePol.rows[0]);

await client.end();
