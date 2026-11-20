"use client";

import { useState } from "react";
import { LuChevronDown, LuPencil, LuPlus, LuTrash2, LuTriangleAlert } from "react-icons/lu";
import { useProcessSafetyMutations } from "@/hooks/useProcessSafety";
import type { PsOverview } from "@/lib/processSafety/progress";
import type { PsActivityInput } from "@/lib/repositories/processSafetyRepository";
import { PS_ELEMENTS, PS_PILLARS, type PsActivity } from "@/types/processSafety";
import { formatPct, PS_STATUS_STYLES } from "./PsDashboard";
import PsActivityModal from "./PsActivityModal";

type ModalState = { elementNumber: number; activity: PsActivity | null } | null;

const formatDate = (ymd: string | null) => (ymd ? ymd.split("-").reverse().join("-") : "—");

export default function PsElementsPanel({
  activities,
  overview,
}: {
  activities: PsActivity[];
  overview: PsOverview;
}) {
  const { orgId, invalidate, upsertPsActivity, updatePsActivityProgress, deletePsActivity } =
    useProcessSafetyMutations();
  const [open, setOpen] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el cambio.");
    } finally {
      invalidate();
    }
  };

  const saveProgress = (activity: PsActivity, raw: string) => {
    const value = Math.min(100, Math.max(0, Math.round(Number(raw))));
    if (Number.isNaN(value) || value === activity.progress) return;
    void run(() => updatePsActivityProgress(orgId, activity.id, value));
  };

  const remove = (activity: PsActivity) => {
    if (!window.confirm(`¿Eliminar la actividad "${activity.title}"? Se pierde su historial de avance.`)) return;
    void run(() => deletePsActivity(orgId, activity.id));
  };

  const save = async (input: PsActivityInput) => {
    await upsertPsActivity(orgId, input); // el modal muestra el error si falla
    invalidate();
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
          <LuTriangleAlert className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {PS_PILLARS.map((pillar) => (
        <section key={pillar.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-bold text-gray-900 bg-gray-50 border-b border-gray-100">
            Pilar {pillar.id}: {pillar.name}
          </h2>
          <ul className="divide-y divide-gray-100">
            {PS_ELEMENTS.filter((el) => el.pillarId === pillar.id).map((el) => {
              const progress = overview.elements[el.number - 1];
              const list = activities.filter((a) => a.elementNumber === el.number);
              const isOpen = open === el.number;
              return (
                <li key={el.number}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : el.number)}
                    aria-expanded={isOpen}
                    className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-gray-50 cursor-pointer"
                  >
                    <LuChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                    <span className="text-sm font-semibold text-gray-900 flex-1 min-w-[12rem]">
                      E{el.number} · {el.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {list.length} actividades
                      {progress.undated > 0 && ` · ${progress.undated} sin fechas`}
                    </span>
                    <span className="font-mono text-xs text-gray-700">
                      {formatPct(progress.summary?.real)} / {formatPct(progress.summary?.plan)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PS_STATUS_STYLES[progress.status].badge}`}
                    >
                      {progress.status}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                              <th className="py-2 pr-2 font-bold">Cód.</th>
                              <th className="py-2 pr-2 font-bold">Actividad</th>
                              <th className="py-2 pr-2 font-bold">Fase</th>
                              <th className="py-2 pr-2 font-bold">Responsable</th>
                              <th className="py-2 pr-2 font-bold">Inicio</th>
                              <th className="py-2 pr-2 font-bold">Término</th>
                              <th className="py-2 pr-2 font-bold">Avance</th>
                              <th className="py-2 font-bold sr-only">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((a) => (
                              <tr key={a.id} className="border-b border-gray-50 align-top">
                                <td className="py-2 pr-2 font-mono text-gray-500">{a.code ?? "—"}</td>
                                <td className="py-2 pr-2 text-gray-900 min-w-[14rem]">{a.title}</td>
                                <td className="py-2 pr-2 text-gray-600 whitespace-nowrap">{a.phase}</td>
                                <td className="py-2 pr-2 text-gray-600">{a.responsible ?? "—"}</td>
                                <td className="py-2 pr-2 text-gray-600 whitespace-nowrap">{formatDate(a.plannedStart)}</td>
                                <td className="py-2 pr-2 text-gray-600 whitespace-nowrap">{formatDate(a.plannedEnd)}</td>
                                <td className="py-2 pr-2">
                                  <label className="flex items-center gap-1">
                                    <span className="sr-only">Avance de {a.title}</span>
                                    <input
                                      key={a.progress}
                                      type="number"
                                      min={0}
                                      max={100}
                                      defaultValue={a.progress}
                                      onBlur={(e) => saveProgress(a, e.target.value)}
                                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                                      className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-teal-200"
                                    />
                                    %
                                  </label>
                                </td>
                                <td className="py-2 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => setModal({ elementNumber: el.number, activity: a })}
                                    aria-label={`Editar ${a.title}`}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-teal-700 cursor-pointer"
                                  >
                                    <LuPencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => remove(a)}
                                    aria-label={`Eliminar ${a.title}`}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                  >
                                    <LuTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModal({ elementNumber: el.number, activity: null })}
                        className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 cursor-pointer"
                      >
                        <LuPlus className="w-3.5 h-3.5" /> Agregar actividad
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {modal && (
        <PsActivityModal
          elementNumber={modal.elementNumber}
          activity={modal.activity}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
