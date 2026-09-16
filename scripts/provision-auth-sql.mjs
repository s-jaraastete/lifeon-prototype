/**
 * Crea usuarios Auth con contraseñas cortas de desarrollo (vía SQL + crypt)
 * y vincula organization_members + profiles.
 *
 * Requiere SUPABASE_DB_PASSWORD en .env.local o entorno.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
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

const ACCOUNTS = [
  { email: "luis.godoy@safetyclub.cl", password: "luis", legacyId: "user_luis", memberId: "mem_user_luis", orgId: "org_luis", name: "Luis Godoy" },
  { email: "sergio.jara@safetyclub.cl", password: "serg", legacyId: "user_sergio", memberId: "mem_user_sergio", orgId: "org_sergio", name: "Sergio Jara" },
  { email: "aldo.berrios@safetyclub.cl", password: "aldo", legacyId: "user_aldo", memberId: "mem_user_aldo", orgId: "org_aldo", name: "Aldo Berríos" },
  { email: "gonzalo.cabrera@safetyclub.cl", password: "gonz", legacyId: "user_gonzalo_c", memberId: "mem_user_gonzalo_c", orgId: "org_gonzalo_c", name: "Gonzalo Cabrera" },
  { email: "gonzalo.beristain@safetyclub.cl", password: "gonz", legacyId: "user_gonzalo_b", memberId: "mem_user_gonzalo_b", orgId: "org_gonzalo_b", name: "Gonzalo Beristain" },
  { email: "sergio.jara@lifeon.cl", password: "serg", legacyId: "demo_sergio", memberId: "mem_demo_sergio", orgId: "org_demo", name: "Sergio A. Jara Astete" },
];

const INSTANCE_ID = "00000000-0000-0000-0000-000000000000";

async function main() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gezcblnyteijkckabkyh.supabase.co")
    .replace("https://", "")
    .replace(".supabase.co", "");
  if (!password) {
    console.error("Falta SUPABASE_DB_PASSWORD");
    process.exit(1);
  }

  const region = process.env.SUPABASE_POOLER_REGION || "sa-east-1";
  const client = new pg.Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  /** GoTrue fails sign-in when token columns are NULL (must be ''). */
  await client.query(`
    UPDATE auth.users SET
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      reauthentication_token = COALESCE(reauthentication_token, '')
    WHERE confirmation_token IS NULL
       OR recovery_token IS NULL
       OR email_change IS NULL
       OR email_change_token_new IS NULL
       OR email_change_token_current IS NULL
       OR reauthentication_token IS NULL
  `);

  for (const acc of ACCOUNTS) {
    const email = acc.email.toLowerCase();
    const parts = acc.name.split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    const existing = await client.query(`SELECT id FROM auth.users WHERE lower(email) = $1 LIMIT 1`, [email]);
    let userId = existing.rows[0]?.id;

    if (userId) {
      const idCheck = await client.query(
        `SELECT 1 FROM auth.identities WHERE user_id = $1::uuid AND provider = 'email' LIMIT 1`,
        [userId]
      );
      if (idCheck.rowCount === 0) {
        const providerId = String(userId);
        await client.query(
          `INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1::uuid, $2, $3::jsonb, 'email', NOW(), NOW(), NOW()
          )`,
          [userId, providerId, JSON.stringify({ sub: userId, email, email_verified: true })]
        );
        console.log("  → identity Auth reparada para", email);
      }
    }

    if (!userId) {
      const ins = await client.query(
        `INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at,
          confirmation_token, recovery_token, email_change,
          email_change_token_new, email_change_token_current, reauthentication_token,
          raw_app_meta_data, raw_user_meta_data, is_sso_user
        ) VALUES (
          $1, gen_random_uuid(), 'authenticated', 'authenticated', $2,
          crypt($3, gen_salt('bf')),
          NOW(), NOW(), NOW(), '', '', '', '', '', '',
          '{"provider":"email","providers":["email"]}'::jsonb,
          $4::jsonb,
          false
        )
        RETURNING id`,
        [
          INSTANCE_ID,
          email,
          acc.password,
          JSON.stringify({ full_name: acc.name, legacy_user_id: acc.legacyId, org_id: acc.orgId }),
        ]
      );
      userId = ins.rows[0].id;

      const providerId = String(userId);
      await client.query(
        `INSERT INTO auth.identities (
          id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1::uuid, $2, $3::jsonb, 'email', NOW(), NOW(), NOW()
        )`,
        [userId, providerId, JSON.stringify({ sub: userId, email, email_verified: true })]
      );
      console.log("Creado Auth:", email, userId);
    } else {
      await client.query(
        `UPDATE auth.users SET
          encrypted_password = crypt($1, gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          confirmation_token = COALESCE(confirmation_token, ''),
          recovery_token = COALESCE(recovery_token, ''),
          email_change = COALESCE(email_change, ''),
          email_change_token_new = COALESCE(email_change_token_new, ''),
          email_change_token_current = COALESCE(email_change_token_current, ''),
          reauthentication_token = COALESCE(reauthentication_token, ''),
          updated_at = NOW()
        WHERE id = $2`,
        [acc.password, userId]
      );
      console.log("Actualizado password Auth:", email, userId);
    }

    await client.query(
      `INSERT INTO organization_members (
        id, organization_id, auth_user_id, user_id, email, name, first_name, last_name, role, status, permissions
      ) VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, 'Administrador', 'Activo', '{}'::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id,
        user_id = EXCLUDED.user_id,
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = 'Administrador',
        status = 'Activo',
        updated_at = NOW()`,
      [acc.memberId, acc.orgId, userId, acc.legacyId, email, acc.name, firstName, lastName]
    );

    await client.query(
      `INSERT INTO profiles (id, first_name, last_name)
       VALUES ($1::uuid, $2, $3)
       ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name`,
      [userId, firstName, lastName]
    );
    console.log("  → membership + profile OK");
  }

  await client.end();
  console.log("Provision Auth SQL completado.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
