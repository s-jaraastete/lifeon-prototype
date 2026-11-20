/**
 * Datos de ejemplo para Seguridad de Procesos: fechas planificadas, % real e historial quincenal.
 * Sobrescribe fechas, avance e historial de TODAS las actividades de la organización indicada.
 * Uso: node scripts/seed-process-safety-demo.mjs <organization_id>
 */
import { connectSupabaseDb } from "./lib/pgConnect.mjs";

const orgId = process.argv[2];
if (!orgId) {
  console.error("Uso: node scripts/seed-process-safety-demo.mjs <organization_id>");
  process.exit(1);
}

const DAY = 86400000;
const today = new Date();
today.setUTCHours(12, 0, 0, 0);
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const ymd = (d) => d.toISOString().slice(0, 10);
const clamp = (n) => Math.max(0, Math.min(100, n));

// Plan de 12 meses que partió hace ~6. Cada pilar parte un poco después que el anterior.
const projectStart = addDays(today, -180);
const PILLAR_OFFSET = { 1: 0, 2: 30, 3: 60, 4: 90 };
const pillarOf = (e) => (e <= 5 ? 1 : e <= 7 ? 2 : e <= 18 ? 3 : 4);
const ELEMENT_SPAN = 270;

// Real = plan × factor: < 1 atrasado, ≥ 1 al día. E13 parte en el futuro y queda "No iniciado".
const FACTOR = {
  1: 1.0, 2: 0.8, 3: 1.1, 4: 0.7, 5: 1.15, 6: 0.75, 7: 1.0, 8: 1.1, 9: 0.85, 10: 0.6,
  11: 1.05, 12: 0.9, 13: 0, 14: 1.1, 15: 0.7, 16: 1.0, 17: 1.2, 18: 0.55, 19: 1.25, 20: 1.1,
};

const client = await connectSupabaseDb();
const { rows } = await client.query(
  `SELECT id, element_number, phase FROM ps_activities
   WHERE organization_id = $1 ORDER BY element_number, sort_order`,
  [orgId]
);
if (!rows.length) {
  console.error(`La organización ${orgId} no tiene actividades. Carga la plantilla base primero.`);
  await client.end();
  process.exit(1);
}

const byElement = new Map();
for (const r of rows) byElement.set(r.element_number, [...(byElement.get(r.element_number) ?? []), r]);

const updates = [];
const logs = [];
for (const [element, list] of byElement) {
  const elementStart =
    element === 13 ? addDays(today, 20) : addDays(projectStart, PILLAR_OFFSET[pillarOf(element)]);
  list.forEach((a, i) => {
    const start = addDays(elementStart, Math.floor((i / list.length) * (ELEMENT_SPAN - 45)));
    const end = addDays(start, 30 + ((i * 7) % 31));
    const planned =
      today <= start ? 0 : today >= end ? 1 : (today - start) / (end - start);
    const progress = clamp(Math.round((planned * 100 * FACTOR[element]) / 5) * 5);
    updates.push([a.id, ymd(start), ymd(end), progress]);

    // Historial: crecimiento lineal desde el inicio hasta el valor de hoy, un registro cada 14 días.
    if (progress > 0) {
      for (let d = addDays(start, 14); d < today; d = addDays(d, 14)) {
        const value = Math.round((progress * (d - start)) / (today - start));
        if (value > 0) logs.push([a.id, value, ymd(d)]);
      }
    }
  });
}

try {
  await client.query("BEGIN");
  await client.query(
    `DELETE FROM ps_progress_log WHERE organization_id = $1`,
    [orgId]
  );
  await client.query(
    `UPDATE ps_activities a
        SET planned_start = u.s::date, planned_end = u.e::date, progress = u.p::smallint
       FROM unnest($2::text[], $3::text[], $4::text[], $5::int[]) AS u(id, s, e, p)
      WHERE a.id = u.id AND a.organization_id = $1`,
    [orgId, updates.map((u) => u[0]), updates.map((u) => u[1]), updates.map((u) => u[2]), updates.map((u) => u[3])]
  );
  // El trigger registró el avance de hoy; se agrega el historial previo.
  await client.query(
    `INSERT INTO ps_progress_log (organization_id, activity_id, progress, recorded_on)
     SELECT $1, l.id, l.p::smallint, l.d::date
       FROM unnest($2::text[], $3::int[], $4::text[]) AS l(id, p, d)
     ON CONFLICT (activity_id, recorded_on) DO UPDATE SET progress = EXCLUDED.progress`,
    [orgId, logs.map((l) => l[0]), logs.map((l) => l[1]), logs.map((l) => l[2])]
  );
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Revertido:", e.message || e);
  await client.end();
  process.exit(1);
}

const summary = await client.query(
  `SELECT count(*)::int AS actividades, count(planned_start)::int AS con_fechas,
          round(avg(progress), 1) AS avance_promedio,
          (SELECT count(*)::int FROM ps_progress_log WHERE organization_id = $1) AS registros_historial
     FROM ps_activities WHERE organization_id = $1`,
  [orgId]
);
console.log("Listo:", summary.rows[0]);
await client.end();
