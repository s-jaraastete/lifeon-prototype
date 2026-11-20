import { parseYmd, plannedFraction, type SCurveBuildResult, type SCurvePoint } from "@/lib/preventive/sCurve";
import {
  PS_ELEMENTS,
  PS_PILLARS,
  type PsActivity,
  type PsElementStatus,
  type PsPillarId,
  type PsProgressLogEntry,
  type PsProgressSummary,
} from "@/types/processSafety";

export type PsLogIndex = Map<string, PsProgressLogEntry[]>;

export interface PsElementProgress {
  elementNumber: number;
  /** null cuando el elemento no tiene actividades con fechas */
  summary: PsProgressSummary | null;
  status: PsElementStatus;
  total: number;
  undated: number;
}

export interface PsPillarProgress {
  pillarId: PsPillarId;
  summary: PsProgressSummary | null;
  elements: PsElementProgress[];
}

export interface PsOverview {
  global: PsProgressSummary | null;
  pillars: PsPillarProgress[];
  elements: PsElementProgress[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function todayYmd(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Historial por actividad, ordenado por fecha ascendente. */
export function indexLogs(logs: PsProgressLogEntry[]): PsLogIndex {
  const idx: PsLogIndex = new Map();
  for (const log of logs) {
    const list = idx.get(log.activityId) ?? [];
    list.push(log);
    idx.set(log.activityId, list);
  }
  for (const list of idx.values()) list.sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
  return idx;
}

/** % real vigente a la fecha asOf: hoy o después usa el valor actual; antes, el último registro ≤ asOf. */
export function progressAt(activity: PsActivity, logs: PsLogIndex, asOf: string): number {
  if (asOf >= todayYmd()) return activity.progress;
  let value = 0;
  for (const log of logs.get(activity.id) ?? []) {
    if (log.recordedOn > asOf) break;
    value = log.progress;
  }
  return value;
}

function isDated(a: PsActivity): boolean {
  const start = a.plannedStart ? parseYmd(a.plannedStart) : null;
  const end = a.plannedEnd ? parseYmd(a.plannedEnd) : null;
  return Boolean(start && end && end >= start);
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
}

/** Promedio simple (peso igual) de real y plan sobre actividades con fechas. */
function summarizeActivities(
  activities: PsActivity[],
  logs: PsLogIndex,
  asOf: string
): PsProgressSummary | null {
  const at = parseYmd(asOf);
  const dated = activities.filter(isDated);
  if (!at || dated.length === 0) return null;
  const real = average(dated.map((a) => progressAt(a, logs, asOf)))!;
  const plan = average(
    dated.map((a) => 100 * plannedFraction(parseYmd(a.plannedStart!)!, parseYmd(a.plannedEnd!)!, at))
  )!;
  return { real: round1(real), plan: round1(plan) };
}

function averageSummaries(list: (PsProgressSummary | null)[]): PsProgressSummary | null {
  const present = list.filter((s): s is PsProgressSummary => s !== null);
  if (!present.length) return null;
  return {
    real: round1(average(present.map((s) => s.real))!),
    plan: round1(average(present.map((s) => s.plan))!),
  };
}

export function elementStatus(summary: PsProgressSummary | null): PsElementStatus {
  if (!summary || (summary.real === 0 && summary.plan === 0)) return "No iniciado";
  return summary.real >= summary.plan ? "Al día" : "Atrasado";
}

/** Elemento = promedio de actividades; pilar = promedio de elementos; global = promedio de pilares. */
export function buildPsOverview(
  activities: PsActivity[],
  logs: PsLogIndex,
  asOf: string
): PsOverview {
  const elements: PsElementProgress[] = PS_ELEMENTS.map((el) => {
    const list = activities.filter((a) => a.elementNumber === el.number);
    const summary = summarizeActivities(list, logs, asOf);
    return {
      elementNumber: el.number,
      summary,
      status: elementStatus(summary),
      total: list.length,
      undated: list.filter((a) => !isDated(a)).length,
    };
  });

  const pillars: PsPillarProgress[] = PS_PILLARS.map((p) => {
    const pillarElements = elements.filter(
      (e) => PS_ELEMENTS[e.elementNumber - 1].pillarId === p.id
    );
    return {
      pillarId: p.id,
      summary: averageSummaries(pillarElements.map((e) => e.summary)),
      elements: pillarElements,
    };
  });

  return { global: averageSummaries(pillars.map((p) => p.summary)), pillars, elements };
}

function addDays(ymd: string, days: number): string {
  const d = parseYmd(ymd)!;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Curva S global (misma agregación que el resumen), con el real cortado en hoy. */
export function buildPsSCurve(activities: PsActivity[], logs: PsLogIndex): SCurveBuildResult {
  if (activities.length === 0) return { ok: false, reason: "no_activities" };
  const dated = activities.filter(isDated);
  if (dated.length === 0) return { ok: false, reason: "no_valid_dates" };

  const minDate = dated.map((a) => a.plannedStart!).sort()[0];
  const maxEnd = dated.map((a) => a.plannedEnd!).sort().at(-1)!;
  const today = todayYmd();
  const maxDate = maxEnd > today ? maxEnd : today;
  const spanDays = (parseYmd(maxDate)!.getTime() - parseYmd(minDate)!.getTime()) / 86400000;
  const stepDays = spanDays > 365 ? 14 : 7;

  const dates: string[] = [];
  for (let d = minDate; d < maxDate; d = addDays(d, stepDays)) dates.push(d);
  dates.push(maxDate);

  const points: SCurvePoint[] = dates.map((date) => {
    const global = buildPsOverview(activities, logs, date).global;
    return {
      date,
      planned: Math.round(global?.plan ?? 0),
      actual: date > today ? null : Math.round(global?.real ?? 0),
    };
  });

  return { ok: true, points, minDate, maxDate };
}
