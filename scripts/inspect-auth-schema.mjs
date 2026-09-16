import pg from "pg";
const password = process.env.SUPABASE_DB_PASSWORD;
const ref = "gezcblnyteijkckabkyh";
const c = new pg.Client({
  connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});
await c.connect();
const r = await c.query(
  `SELECT column_name FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' ORDER BY ordinal_position`
);
console.log(r.rows.map((x) => x.column_name).join("\n"));
await c.end();
