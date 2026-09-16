"use client";

import clsx from "clsx";
import {
  LuX,
  LuCheck,
  LuUserRound,
  LuUsers,
  LuFolderTree,
  LuCircleCheck,
  LuArrowRight,
} from "react-icons/lu";
import { useSetupGuideProgress } from "@/hooks/useSetupGuideProgress";
import type { DashboardMenuKey } from "@/types/dashboardNav";

type SetupGuideProps = {
  isOpen: boolean;
  onComplete: () => void;
  onMinimize: () => void;
  onNavigate: (menu: DashboardMenuKey) => void;
  onOpenAccount: () => void;
};

const STEP_META = [
  {
    id: "profile" as const,
    title: "Configurar perfil",
    description:
      "Carga tu foto, el logo de la empresa y revisa tus datos en Mi Cuenta.",
    icon: LuUserRound,
    actionLabel: "Ir a Mi Cuenta",
    action: "account" as const,
  },
  {
    id: "users" as const,
    title: "Configurar usuarios",
    description:
      "Agrega las personas que tendrán acceso a LifeOn y define sus roles y permisos.",
    icon: LuUsers,
    actionLabel: "Ir a Usuarios",
    menu: "users" as const,
  },
  {
    id: "structure" as const,
    title: "Configurar estructura organizacional",
    description:
      "Registra centros de trabajo, áreas, procesos, subprocesos y cargos.",
    icon: LuFolderTree,
    actionLabel: "Ir a Estructura",
    menu: "org" as const,
  },
];

export default function SetupGuide({
  isOpen,
  onComplete,
  onMinimize,
  onNavigate,
  onOpenAccount,
}: SetupGuideProps) {
  const { steps, allComplete } = useSetupGuideProgress();

  if (!isOpen) return null;

  const handleAction = (meta: (typeof STEP_META)[number]) => {
    if (meta.action === "account") {
      onOpenAccount();
      onMinimize();
      return;
    }
    if (meta.menu) {
      onNavigate(meta.menu);
      onMinimize();
    }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        role="dialog"
        aria-labelledby="setup-guide-title"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h2 id="setup-guide-title" className="text-base font-bold text-gray-900">
              ¿Qué debo hacer primero en LifeOn?
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Guía de puesta en marcha. Puedes continuar más tarde.
            </p>
          </div>
          <button
            type="button"
            onClick={onMinimize}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            aria-label="Minimizar guía"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3 max-h-[min(70vh,520px)] overflow-y-auto">
          {STEP_META.map((meta, idx) => {
            const progress = steps.find((s) => s.id === meta.id);
            const done = progress?.complete ?? false;
            const Icon = meta.icon;
            return (
              <div
                key={meta.id}
                className={clsx(
                  "rounded-xl border p-3.5 transition",
                  done ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200 bg-gray-50/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                      done ? "bg-emerald-100 text-emerald-700" : "bg-white text-teal-700 border border-teal-100"
                    )}
                  >
                    {done ? <LuCircleCheck className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Paso {idx + 1}
                      </span>
                      {done && (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                          <LuCheck className="w-3 h-3" /> Listo
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{meta.title}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{meta.description}</p>
                    {progress?.subChecks && progress.subChecks.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {progress.subChecks.map((check) => (
                          <li
                            key={check.label}
                            className={clsx(
                              "text-[11px] flex items-center gap-1.5",
                              check.done ? "text-emerald-700" : "text-gray-500"
                            )}
                          >
                            {check.done ? (
                              <LuCheck className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <span className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />
                            )}
                            {check.label}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!done && (
                      <button
                        type="button"
                        onClick={() => handleAction(meta)}
                        className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                      >
                        {meta.actionLabel}
                        <LuArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50/80">
          <button
            type="button"
            onClick={onMinimize}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl cursor-pointer"
          >
            Minimizar (sigue en pantalla)
          </button>
          {allComplete && (
            <button
              type="button"
              onClick={onComplete}
              className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl cursor-pointer"
            >
              Finalizar guía
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
