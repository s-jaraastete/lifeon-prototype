import { ProgramActivity } from "@/types/preventiveProgram";

export interface SCurvePoint {
  date: string;
  planned: number;
  actual: number;
}

function parseYmd(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function plannedFraction(start: Date, end: Date, t: Date): number {
  if (t < start) return 0;
  if (t >= end) return 1;
  const total = daysBetween(start, end);
  if (total <= 0) return 1;
  return clamp(daysBetween(start, t) / total, 0, 1);
}

function actualFraction(
  start: Date,
  end: Date,
  t: Date,
  today: Date,
  progressPct: number,
  status: ProgramActivity["status"]
): number {
  const actual = status === "Cumplida" ? 100 : clamp(progressPct, 0, 100);
  const actualUnit = actual / 100;
  if (t < start) return 0;
  const anchor = today < end ? today : end;
  if (t >= anchor) return actualUnit;
  const span = daysBetween(start, anchor);
  if (span <= 0) return actualUnit;
  return actualUnit * clamp(daysBetween(start, t) / span, 0, 1);
}

export type SCurveBuildResult =
  | { ok: true; points: SCurvePoint[]; minDate: string; maxDate: string }
  | { ok: false; reason: "no_activities" | "no_valid_dates" };

export function buildSCurveSeries(
  activities: ProgramActivity[],
  categoryFilter?: string
): SCurveBuildResult {
  let list = activities;
  if (categoryFilter && categoryFilter !== "Todas") {
    list = list.filter((a) => a.category === categoryFilter);
  }
  if (list.length === 0) return { ok: false, reason: "no_activities" };

  const valid = list
    .map((a) => {
      const start = parseYmd(a.startDate);
      const end = parseYmd(a.endDate);
      if (!start || !end || end < start) return null;
      const weight = a.weight ?? 1;
      return { activity: a, start, end, weight };
    })
    .filter(Boolean) as {
    activity: ProgramActivity;
    start: Date;
    end: Date;
    weight: number;
  }[];

  if (valid.length === 0) return { ok: false, reason: "no_valid_dates" };

  const W = valid.reduce((s, v) => s + v.weight, 0);
  const minStart = new Date(Math.min(...valid.map((v) => v.start.getTime())));
  const maxEnd = new Date(Math.max(...valid.map((v) => v.end.getTime())));
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const spanDays = daysBetween(minStart, maxEnd);
  const stepDays = spanDays > 90 ? 30 : 7;
  const points: SCurvePoint[] = [];

  for (let t = new Date(minStart); t <= maxEnd; t.setDate(t.getDate() + stepDays)) {
    const current = new Date(t);
    let plannedSum = 0;
    let actualSum = 0;
    valid.forEach((v) => {
      plannedSum += v.weight * plannedFraction(v.start, v.end, current);
      actualSum +=
        v.weight *
        actualFraction(
          v.start,
          v.end,
          current,
          today,
          v.activity.progress,
          v.activity.status
        );
    });
    points.push({
      date: current.toISOString().slice(0, 10),
      planned: Math.round((100 * plannedSum) / W),
      actual: Math.round((100 * actualSum) / W),
    });
  }

  const lastDate = maxEnd.toISOString().slice(0, 10);
  if (points.length === 0 || points[points.length - 1].date !== lastDate) {
    let plannedSum = 0;
    let actualSum = 0;
    valid.forEach((v) => {
      plannedSum += v.weight * plannedFraction(v.start, v.end, maxEnd);
      actualSum +=
        v.weight *
        actualFraction(
          v.start,
          v.end,
          maxEnd,
          today,
          v.activity.progress,
          v.activity.status
        );
    });
    points.push({
      date: lastDate,
      planned: Math.round((100 * plannedSum) / W),
      actual: Math.round((100 * actualSum) / W),
    });
  }

  return {
    ok: true,
    points,
    minDate: minStart.toISOString().slice(0, 10),
    maxDate: maxEnd.toISOString().slice(0, 10),
  };
}
