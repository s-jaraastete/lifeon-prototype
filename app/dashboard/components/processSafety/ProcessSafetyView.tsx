"use client";

import { useMemo, useState } from "react";
import { LuFlame, LuLoader, LuTriangleAlert } from "react-icons/lu";
import { useProcessSafetyData, useProcessSafetyMutations } from "@/hooks/useProcessSafety";
import { buildPsOverview, buildPsSCurve, indexLogs, todayYmd } from "@/lib/processSafety/progress";
import PsDashboard from "./PsDashboard";
import PsElementsPanel from "./PsElementsPanel";

type Tab = "dashboard" | "elementos";

export default function ProcessSafetyView() {
  const { activities, log } = useProcessSafetyData();
  const { orgId, invalidate, seedPsBaseTemplate } = useProcessSafetyMutations();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [asOf, setAsOf] = useState(todayYmd);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const list = useMemo(() => activities.data ?? [], [activities.data]);
  const logIndex = useMemo(() => indexLogs(log.data ?? []), [log.data]);
  const overview = useMemo(() => buildPsOverview(list, logIndex, asOf), [list, logIndex, asOf]);
  const curve = useMemo(() => buildPsSCurve(list, logIndex), [list, logIndex]);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      await seedPsBaseTemplate(orgId);
      invalidate();
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : "No se pudo cargar la plantilla.");
    } finally {
      setSeeding(false);
    }
  };

  const loadError = activities.error ?? log.error;

  return (
    // relative: contiene los textos sr-only (absolutos) dentro del scroll del dashboard
    <div className="relative flex flex-col gap-4">
      <section className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <LuFlame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Seguridad de Procesos
            </h1>
            <p className="text-xs text-gray-500">
              Implementación de los 20 elementos en 4 pilares: avance real vs planificado.
            </p>
          </div>
        </div>
        {list.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              Fecha de análisis
              <input
                type="date"
                value={asOf}
                max={todayYmd()}
                onChange={(e) => e.target.value && setAsOf(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            </label>
            <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1" role="tablist">
              {(["dashboard", "elementos"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    tab === t ? "bg-white text-teal-700 shadow-xs" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "dashboard" ? "Dashboard" : "Elementos y actividades"}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <LuTriangleAlert className="w-4 h-4 shrink-0" />
          {loadError.message}
        </div>
      ) : activities.isLoading || log.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
          <LuLoader className="w-4 h-4 animate-spin" /> Cargando…
        </div>
      ) : list.length === 0 ? (
        <section className="bg-white rounded-2xl p-10 shadow-xs border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
            <LuFlame className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Inicia la implementación</h2>
          <p className="text-sm text-gray-500 max-w-lg mb-6">
            Carga la plantilla base con las actividades de los 20 elementos. Luego puedes asignar
            fechas, responsables y avance, y agregar o quitar actividades.
          </p>
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-md shadow-teal-700/20 cursor-pointer flex items-center gap-2"
          >
            {seeding && <LuLoader className="w-4 h-4 animate-spin" />}
            Cargar plantilla base
          </button>
          {seedError && <p className="mt-3 text-xs text-red-600">{seedError}</p>}
        </section>
      ) : tab === "dashboard" ? (
        <PsDashboard overview={overview} curve={curve} />
      ) : (
        <PsElementsPanel activities={list} overview={overview} />
      )}
    </div>
  );
}
