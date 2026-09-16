"use client";

import clsx from "clsx";
import {
  LuCheck,
  LuChevronDown,
  LuListChecks,
  LuMaximize2,
  LuMinimize2,
} from "react-icons/lu";
import { useSetupGuideProgress } from "@/hooks/useSetupGuideProgress";

type SetupGuideCompanionProps = {
  collapsed: boolean;
  onToggleCollapsed: (collapsed: boolean) => void;
  onOpenModal: () => void;
};

const STEP_LABELS = ["Perfil", "Usuarios", "Estructura"];

export default function SetupGuideCompanion({
  collapsed,
  onToggleCollapsed,
  onOpenModal,
}: SetupGuideCompanionProps) {
  const { steps, allComplete } = useSetupGuideProgress();
  const doneCount = steps.filter((s) => s.complete).length;
  const total = steps.length;
  const pct = Math.round((doneCount / total) * 100);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => onToggleCollapsed(false)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg border border-teal-500/30 cursor-pointer transition animate-in fade-in slide-in-from-bottom-2"
        title="Abrir primeros pasos en LifeOn"
      >
        <LuListChecks className="w-5 h-5 flex-shrink-0" />
        <span className="text-xs font-bold">Primeros pasos</span>
        <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-lg">
          {doneCount}/{total}
        </span>
      </button>
    );
  }

  return (
    <aside
      className="fixed bottom-5 right-5 z-40 w-[min(100vw-2rem,22rem)] rounded-2xl border border-teal-200/80 bg-white shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
      aria-label="Guía de primeros pasos"
    >
      <div className="px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-100/90">
            Acompañamiento
          </p>
          <h3 className="text-sm font-bold leading-tight mt-0.5">
            ¿Qué hacer primero en LifeOn?
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onToggleCollapsed(true)}
          className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer flex-shrink-0"
          title="Minimizar"
        >
          <LuMinimize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1.5">
          <span>Progreso de puesta en marcha</span>
          <span className="text-teal-700">{doneCount}/{total} pasos</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="px-3 py-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
        {steps.map((step, idx) => (
          <li
            key={step.id}
            className={clsx(
              "flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs",
              step.complete ? "text-emerald-800 bg-emerald-50/80" : "text-gray-700"
            )}
          >
            <span
              className={clsx(
                "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
                step.complete
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {step.complete ? <LuCheck className="w-3 h-3" /> : idx + 1}
            </span>
            <span className="font-medium truncate">{STEP_LABELS[idx]}</span>
          </li>
        ))}
      </ul>

      <div className="px-3 py-3 border-t border-gray-100 flex flex-col gap-2 bg-gray-50/80">
        <button
          type="button"
          onClick={onOpenModal}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer"
        >
          <LuMaximize2 className="w-3.5 h-3.5" />
          {allComplete ? "Revisar y finalizar guía" : "Ver guía detallada"}
        </button>
        <button
          type="button"
          onClick={() => onToggleCollapsed(true)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
        >
          <LuChevronDown className="w-3.5 h-3.5" />
          Minimizar
        </button>
      </div>
    </aside>
  );
}
