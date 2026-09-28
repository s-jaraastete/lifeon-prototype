import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv6first");

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

const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
  .replace("https://", "")
  .replace(".supabase.co", "")
  .trim();
const password = process.env.SUPABASE_DB_PASSWORD;
const poolerRegion = process.env.SUPABASE_POOLER_REGION || "sa-east-1";
const encodedPassword = encodeURIComponent(password);
const connectionCandidates = [
  process.env.DATABASE_URL,
  `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${poolerRegion}.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${poolerRegion}.pooler.supabase.com:6543/postgres`,
].filter(Boolean);

async function connectClient() {
  let lastError;
  for (const connectionString of connectionCandidates) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
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

const client = await connectClient();

const versions = await client.query(`
  SELECT v.id, v.task_name, v.status,
         v.content_snapshot->'planning'->'workContext'->>'supervisorMemberId' AS sup_id,
         v.content_snapshot->'planning'->'workContext'->>'supervisorName' AS sup_name,
         jsonb_array_length(COALESCE(v.content_snapshot->'planning'->'workers','[]'::jsonb)) AS worker_count
  FROM artp_versions v
  WHERE v.status = 'en_revision'
  ORDER BY v.updated_at DESC
  LIMIT 5
`);
console.log("Versiones en_revision:", versions.rows);

const members = await client.query(`
  SELECT m.id, m.name, m.email, m.auth_user_id, m.status
  FROM organization_members m
  WHERE lower(coalesce(m.name,'')) LIKE '%mat%'
     OR lower(coalesce(m.email,'')) LIKE '%mat%'
  LIMIT 10
`);
console.log("Miembros Matías:", members.rows);

const supMember = await client.query(
  `SELECT id, name, email, auth_user_id, status FROM organization_members WHERE id = $1`,
  ["usr-1790282261203-3a8s"]
);
console.log("Supervisor member row:", supMember.rows);

const deliveries = await client.query(`
  SELECT d.id, d.source_id, d.assignee_member_id, d.assignee_auth_user_id,
         d.status, d.title,
         d.content_snapshot->>'assigneeRole' AS role,
         m.name, m.email
  FROM document_deliveries d
  LEFT JOIN organization_members m ON m.id = d.assignee_member_id
  WHERE d.source_type = 'artp'
  ORDER BY d.assigned_at DESC
  LIMIT 20
`);
console.log("Entregas ARTP:", deliveries.rows);

  await client.query(`
  SELECT id, jsonb_pretty(content_snapshot->'planning'->'workers') AS workers
  FROM artp_versions WHERE id = 'org_sergio_artp_ver_1790609346691'
`).then(r => console.log("Workers JSON:", r.rows));

  await client.end();
