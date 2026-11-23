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
import { PS_ELEMENTS, PS_PILLARS, type PsElementStatus } from "@/types/processSafety";
import ChartTooltip from "../ChartTooltip";
import SCurveChart from "../SCurveChart";

export const PS_STATUS_STYLES: Record<PsElementStatus, { dot: string; badge: string; text: string }> = {
  "Al día": {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
  },
  "No iniciado": {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    text: "text-amber-700",
  },
  Atrasado: { dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200", text: "text-red-700" },
};

const REAL_COLOR = "#0d9488";
const PLAN_COLOR = "#cbd5e1";

export const formatPct = (value: number | undefined | null) =>
  value == null ? "—" : `${value.toLocaleString("es-CL", { maximumFractionDigits: 1 })}%`;

const formatDelta = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("es-CL", { maximumFractionDigits: 1 })} pts`;

type ElementDatum = {
  label: string;
  name: string;
  real: number;
  plan: number;
  delta: number;
  status: PsElementStatus;
};

function ElementTooltip({ active, datum }: { active?: boolean; datum?: ElementDatum }) {
  if (!active || !datum) return null;
  return (
    <ChartTooltip
      title={`${datum.label} · ${datum.name}`}
      rows={[
        { label: "Real", value: formatPct(datum.real), color: REAL_COLOR },
        { label: "Planificado", value: formatPct(datum.plan), color: PLAN_COLOR },
      ]}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className={`font-semibold ${PS_STATUS_STYLES[datum.status].text}`}>{datum.status}</span>
          <span className="text-gray-600 tabular-nums">{formatDelta(datum.delta)}</span>
        </div>
      }
    />
  );
}

export default function PsDashboard({
  overview,
  curve,
}: {
  overview: PsOverview;
  curve: SCurveBuildResult;
}) {
  const barData: ElementDatum[] = overview.elements.map((e) => ({
    label: `E${e.elementNumber}`,
    name: PS_ELEMENTS[e.elementNumber - 1].name,
    real: e.summary?.real ?? 0,
    plan: e.summary?.plan ?? 0,
    delta: e.summary ? Math.round((e.summary.real - e.summary.plan) * 10) / 10 : 0,
    status: e.status,
  }));

  const barTooltip = (
    <Tooltip
      cursor={{ fill: "rgba(0,0,0,0.04)" }}
      content={({ active, payload }) => (
        <ElementTooltip active={active} datum={payload?.[0]?.payload as ElementDatum | undefined} />
      )}
    />
  );

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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-4 items-start">
        {/* Columna izquierda: gráficos */}
        <div className="flex flex-col gap-4 min-w-0">
          <SCurveChart
            result={curve}
            title="Curva S — Avance real vs planificado"
            emptyMessage="Asigna fechas de inicio y término a las actividades para ver la Curva S."
          />

          <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Avance por elemento: real vs planificado</h3>
            <p className="text-xs text-gray-500 mb-3">A la fecha de análisis seleccionada</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  {barTooltip}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="real" name="Real" fill={REAL_COLOR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="plan" name="Planificado" fill={PLAN_COLOR} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <h4 className="text-xs font-bold text-gray-700 mt-6">Diferencia real − planificado</h4>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <ReferenceLine y={0} stroke="#9ca3af" />
                  {barTooltip}
                  <Bar dataKey="delta" name="Diferencia" radius={2}>
                    {barData.map((d) => (
                      <Cell key={d.label} fill={d.delta < 0 ? "#ef4444" : "#10b981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Columna derecha: indicadores de estado por elemento */}
        <section
          aria-labelledby="ps-indicadores"
          className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100"
        >
          <h3 id="ps-indicadores" className="text-sm font-bold text-gray-900">
            Indicadores de Estado de Avance
          </h3>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
            {(Object.keys(PS_STATUS_STYLES) as PsElementStatus[]).map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${PS_STATUS_STYLES[s].dot}`} aria-hidden />
                {s === "Al día" ? "Al día (real ≥ plan)" : s === "Atrasado" ? "Atrasado (real < plan)" : s}
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-x-6 gap-y-5 mt-5">
            {overview.pillars.map((p) => (
              <div key={p.pillarId}>
                <h4 className="text-xs font-semibold text-gray-900 pb-1.5 border-b border-gray-100">
                  Pilar {p.pillarId} · {PS_PILLARS[p.pillarId - 1].name}
                </h4>
                <ul className="grid grid-cols-4 gap-2 mt-2">
                  {p.elements.map((e, i) => {
                    const tipId = `ps-tip-${e.elementNumber}`;
                    // Grilla de 4: los extremos alinean el tooltip hacia adentro para no salirse del panel
                    const col = i % 4;
                    const align = col === 0 ? "left-0" : col === 3 ? "right-0" : "left-1/2 -translate-x-1/2";
                    return (
                      <li key={e.elementNumber} className="group relative">
                        <button
                          type="button"
                          aria-describedby={tipId}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-700 tabular-nums hover:border-gray-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 cursor-default"
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${PS_STATUS_STYLES[e.status].dot}`} aria-hidden />
                          E{e.elementNumber}
                        </button>
                        <div
                          id={tipId}
                          role="tooltip"
                          className={`absolute bottom-full mb-2 z-20 w-56 ${align} pointer-events-none invisible opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100`}
                        >
                          <ElementTooltip active datum={barData[e.elementNumber - 1]} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
