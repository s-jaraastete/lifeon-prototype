import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

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
const ref = url.replace("https://", "").replace(".supabase.co", "");

async function main() {
  console.log("URL host:", new URL(url).host);
  console.log("Anon key prefix:", anonKey?.slice(0, 20));

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log("signInWithPassword:", error?.message || `OK ${data.user?.id}`);

  if (!dbPassword) {
    console.log("(skip DB checks: no SUPABASE_DB_PASSWORD)");
    return;
  }

  const client = new pg.Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword)}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const u = await client.query(
    `SELECT id, email, email_confirmed_at IS NOT NULL AS confirmed,
            banned_until, deleted_at, is_sso_user, aud, role, instance_id::text,
            length(encrypted_password) AS pw_len
     FROM auth.users WHERE lower(email) = lower($1)`,
    [email]
  );
  console.log("auth.users row:", u.rows[0]);
  if (u.rows[0]) {
    const i = await client.query(
      `SELECT id::text, provider, provider_id, identity_data FROM auth.identities WHERE user_id = $1`,
      [u.rows[0].id]
    );
    console.log("auth.identities:", i.rows[0] || "(none)");
    const chk = await client.query(
      `SELECT encrypted_password = crypt($1, encrypted_password) AS pass_ok FROM auth.users WHERE id = $2`,
      [password, u.rows[0].id]
    );
    console.log(`crypt('${password}') matches:`, chk.rows[0]?.pass_ok);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
