"use client";

import { useState, type FormEvent } from "react";
import { LuLoader, LuX } from "react-icons/lu";
import type { PsActivityInput } from "@/lib/repositories/processSafetyRepository";
import { PS_ELEMENTS, PS_PHASES, type PsActivity, type PsPhase } from "@/types/processSafety";

const inputClass =
  "w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200";

export default function PsActivityModal({
  elementNumber,
  activity,
  onClose,
  onSave,
}: {
  elementNumber: number;
  /** null = nueva actividad */
  activity: PsActivity | null;
  onClose: () => void;
  onSave: (input: PsActivityInput) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = (key: string) => String(formData.get(key) ?? "").trim() || null;
    const plannedStart = text("plannedStart");
    const plannedEnd = text("plannedEnd");
    if (plannedStart && plannedEnd && plannedEnd < plannedStart) {
      setError("La fecha de término debe ser igual o posterior a la de inicio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: activity?.id,
        elementNumber,
        phase: String(formData.get("phase")) as PsPhase,
        code: text("code"),
        title: text("title") ?? "",
        responsible: text("responsible"),
        plannedStart,
        plannedEnd,
        progress: Math.min(100, Math.max(0, Number(formData.get("progress") ?? 0))),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la actividad.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ps-activity-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div>
            <h2 id="ps-activity-title" className="text-base font-bold text-gray-900">
              {activity ? "Editar actividad" : "Nueva actividad"}
            </h2>
            <p className="text-xs text-gray-500">
              E{elementNumber} · {PS_ELEMENTS[elementNumber - 1].name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Actividad *
            <input name="title" required defaultValue={activity?.title} className={inputClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
              Código
              <input name="code" defaultValue={activity?.code ?? ""} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
              Fase
              <select name="phase" defaultValue={activity?.phase ?? "Operación"} className={inputClass}>
                {PS_PHASES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Responsable
            <input name="responsible" defaultValue={activity?.responsible ?? ""} className={inputClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
              Inicio planificado
              <input type="date" name="plannedStart" defaultValue={activity?.plannedStart ?? ""} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
              Término planificado
              <input type="date" name="plannedEnd" defaultValue={activity?.plannedEnd ?? ""} className={inputClass} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Avance real (%)
            <input
              type="number"
              name="progress"
              min={0}
              max={100}
              step={1}
              defaultValue={activity?.progress ?? 0}
              className={inputClass}
            />
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 cursor-pointer flex items-center gap-2"
            >
              {saving && <LuLoader className="w-3.5 h-3.5 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
