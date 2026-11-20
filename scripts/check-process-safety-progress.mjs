// Auto-chequeo de lib/processSafety/progress.ts. Uso: node scripts/check-process-safety-progress.mjs
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createJiti } from "jiti";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": root } });
const { buildPsOverview, buildPsSCurve, indexLogs, elementStatus } = await jiti.import(
  path.join(root, "lib/processSafety/progress.ts")
);

const act = (id, elementNumber, plannedStart, plannedEnd, progress) => ({
  id,
  organizationId: "org",
  elementNumber,
  phase: "Preparación",
  code: null,
  title: id,
  responsible: null,
  plannedStart,
  plannedEnd,
  progress,
  sortOrder: 0,
});

// E1: a1 plan 2020-01-01→2020-01-11 (50% al 2020-01-06), a2 terminado en plan al 2020-01-06.
// E19: a3 plan 2020-01-01→2020-01-03 (100% al 2020-01-06). a4 sin fechas (excluida).
const activities = [
  act("a1", 1, "2020-01-01", "2020-01-11", 90),
  act("a2", 1, "2020-01-01", "2020-01-02", 100),
  act("a3", 19, "2020-01-01", "2020-01-03", 100),
  act("a4", 19, null, null, 100),
];
const logs = indexLogs([
  { activityId: "a1", progress: 20, recordedOn: "2020-01-03" },
  { activityId: "a1", progress: 40, recordedOn: "2020-01-05" },
  { activityId: "a1", progress: 90, recordedOn: "2020-01-09" },
  { activityId: "a2", progress: 100, recordedOn: "2020-01-02" },
  { activityId: "a3", progress: 50, recordedOn: "2020-01-02" },
]);

const o = buildPsOverview(activities, logs, "2020-01-06");
const e1 = o.elements[0];
// real E1 = (40 + 100)/2 = 70; plan E1 = (50 + 100)/2 = 75
assert.deepEqual(e1.summary, { real: 70, plan: 75 });
assert.equal(e1.status, "Atrasado");
const e19 = o.elements[18];
// a4 sin fechas no cuenta: real 50, plan 100
assert.deepEqual(e19.summary, { real: 50, plan: 100 });
assert.equal(e19.undated, 1);
// Elementos sin actividades no diluyen; pilar 1 = E1, pilar 4 = E19; pilares 2 y 3 vacíos
assert.deepEqual(o.pillars[0].summary, { real: 70, plan: 75 });
assert.equal(o.pillars[1].summary, null);
// Global = promedio de pilares con datos: real (70+50)/2 = 60, plan (75+100)/2 = 87.5
assert.deepEqual(o.global, { real: 60, plan: 87.5 });

// Antes del primer registro el real es 0
assert.equal(buildPsOverview(activities, logs, "2020-01-01").elements[0].summary.real, 0);

assert.equal(elementStatus(null), "No iniciado");
assert.equal(elementStatus({ real: 0, plan: 0 }), "No iniciado");
assert.equal(elementStatus({ real: 10, plan: 10 }), "Al día");

const curve = buildPsSCurve(activities, logs);
assert.equal(curve.ok, true);
assert.equal(curve.points[0].date, "2020-01-01");
assert.ok(curve.points.every((p) => p.actual !== null)); // todo en el pasado
assert.deepEqual(buildPsSCurve([], logs), { ok: false, reason: "no_activities" });

// Plantilla base: 20 elementos, códigos únicos por elemento (son parte del id), sin marcas de terceros.
const { PS_BASE_TEMPLATE } = await jiti.import(path.join(root, "lib/processSafety/baseTemplate.ts"));
assert.deepEqual(Object.keys(PS_BASE_TEMPLATE).map(Number), Array.from({ length: 20 }, (_, i) => i + 1));
for (const [element, steps] of Object.entries(PS_BASE_TEMPLATE)) {
  const codes = steps.map((s) => s.code);
  assert.equal(new Set(codes).size, codes.length, `códigos duplicados en E${element}`);
  for (const s of steps) {
    assert.match(s.code, /^\d{2}[a-z]?$/, `código inválido E${element}: ${s.code}`);
    assert.doesNotMatch(s.title, /energy institute|\bEI\b|pampa|spence|bhp/i);
  }
}

console.log("process-safety progress: OK");
