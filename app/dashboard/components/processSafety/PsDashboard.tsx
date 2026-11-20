"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SCurveBuildResult } from "@/lib/preventive/sCurve";
import type { PsOverview } from "@/lib/processSafety/progress";
import { PS_ELEMENTS, PS_PILLARS, type PsElementStatus, type PsProgressSummary } from "@/types/processSafety";
import SCurveChart from "../SCurveChart";

export const PS_STATUS_STYLES: Record<PsElementStatus, { dot: string; badge: string }> = {
  "Al día": { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Atrasado: { dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" },
  "No iniciado": { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
};

export const formatPct = (value: number | undefined | null) =>
  value == null ? "—" : `${value.toLocaleString("es-CL", { maximumFractionDigits: 1 })}%`;

function RealPlan({ summary }: { summary: PsProgressSummary | null }) {
  return (
    <span className="font-mono text-sm">
      <span className="font-bold text-gray-900">{formatPct(summary?.real)}</span>
      <span className="text-gray-400"> | </span>
      <span className="text-gray-500">{formatPct(summary?.plan)}</span>
    </span>
  );
}

export default function PsDashboard({
  overview,
  curve,
}: {
  overview: PsOverview;
  curve: SCurveBuildResult;
}) {
  const barData = overview.elements.map((e) => ({
    label: `E${e.elementNumber}`,
    name: PS_ELEMENTS[e.elementNumber - 1].name,
    real: e.summary?.real ?? 0,
    plan: e.summary?.plan ?? 0,
    delta: e.summary ? Math.round((e.summary.real - e.summary.plan) * 10) / 10 : 0,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen global y por pilar */}
      <section className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="col-span-2 md:col-span-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-3 md:pb-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Avance real</span>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatPct(overview.global?.real)}</p>
          <span className="text-xs text-gray-500">Planificado: {formatPct(overview.global?.plan)}</span>
        </div>
        {overview.pillars.map((p) => (
          <div key={p.pillarId} className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 leading-tight">
              {PS_PILLARS[p.pillarId - 1].name}
            </span>
            <p className="text-xl font-bold text-gray-900">{formatPct(p.summary?.real)}</p>
            <span className="text-[11px] text-gray-500">Plan: {formatPct(p.summary?.plan)}</span>
          </div>
        ))}
      </section>

      <SCurveChart
        result={curve}
        title="Curva S — Avance real vs planificado"
        emptyMessage="Asigna fechas de inicio y término a las actividades para ver la Curva S."
      />

      {/* Avance por elemento */}
      <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">Avance por elemento: real vs planificado</h3>
        <p className="text-xs text-gray-500 mb-3">A la fecha de análisis seleccionada</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip
                formatter={(value) => [`${value}%`]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="real" name="Real" fill="#0d9488" radius={[3, 3, 0, 0]} />
              <Bar dataKey="plan" name="Planificado" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <h4 className="text-xs font-bold text-gray-700 mt-4">Diferencia real − planificado</h4>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <ReferenceLine y={0} stroke="#9ca3af" />
              <Tooltip
                formatter={(value) => [`${value}%`, "Diferencia"]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
              />
              <Bar dataKey="delta" name="Diferencia" radius={2}>
                {barData.map((d) => (
                  <Cell key={d.label} fill={d.delta < 0 ? "#ef4444" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Estado por pilar */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {overview.pillars.map((p) => (
          <div key={p.pillarId} className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Pilar {p.pillarId}: {PS_PILLARS[p.pillarId - 1].name}
              </h3>
              <RealPlan summary={p.summary} />
            </div>
            <ul className="flex flex-wrap gap-2">
              {p.elements.map((e) => (
                <li
                  key={e.elementNumber}
                  title={`${PS_ELEMENTS[e.elementNumber - 1].name} — ${e.status}: ${formatPct(e.summary?.real)} real / ${formatPct(e.summary?.plan)} plan`}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${PS_STATUS_STYLES[e.status].dot}`} aria-hidden />
                  E{e.elementNumber}
                  <span className="sr-only">{e.status}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 px-1">
        <span className="font-semibold">Estado de avance:</span>
        {(Object.keys(PS_STATUS_STYLES) as PsElementStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${PS_STATUS_STYLES[s].dot}`} aria-hidden />
            {s === "Al día" ? "Al día (real ≥ plan)" : s === "Atrasado" ? "Atrasado (real < plan)" : s}
          </span>
        ))}
      </div>
    </div>
  );
}
