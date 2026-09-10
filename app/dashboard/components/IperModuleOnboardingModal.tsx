"use client";

import React, { useState } from "react";
import clsx from "clsx";
import {
  LuShieldAlert,
  LuSparkles,
  LuCheck,
  LuTriangleAlert,
  LuTable,
  LuLayers,
  LuActivity,
  LuX,
} from "react-icons/lu";
import { IperMethodology } from "@/types/preferences";

interface IperModuleOnboardingModalProps {
  isOpen: boolean;
  onConfirm: (methodology: IperMethodology) => void;
  onClose?: () => void;
  promptMessage?: string;
}

export default function IperModuleOnboardingModal({
  isOpen,
  onConfirm,
  onClose,
  promptMessage,
}: IperModuleOnboardingModalProps) {
  const [selectedMethodology, setSelectedMethodology] = useState<IperMethodology>("dynamic5x5_vep");
  const [hasConfirmedWarning, setHasConfirmedWarning] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!hasConfirmedWarning) return;
    onConfirm(selectedMethodology);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 font-[family-name:var(--font-poppins)] select-none overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200 relative">
        <div>
          {/* Encabezado */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#F04438] flex items-center justify-center font-bold flex-shrink-0">
                <LuTable className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                  Configuración Inicial de Metodología
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  ¿Cómo desea evaluar los riesgos su organización?
                </h2>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                title="Cerrar (Configurar más tarde)"
              >
                <LuX className="w-5 h-5" />
              </button>
            )}
          </div>

          {promptMessage ? (
            <div className="p-3.5 mb-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 font-semibold flex items-center gap-2.5">
              <LuTriangleAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{promptMessage}</span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
              Selecciona la metodología oficial que adoptará tu empresa para la Matriz IPER.
              Esta selección definirá los criterios de probabilidad, consecuencia y priorización.
            </p>
          )}

          {/* Tres opciones principales */}
          <div className="flex flex-col gap-3 mb-6">
            {/* OPCIÓN 1: VEP 3x3 */}
            <div
              onClick={() => setSelectedMethodology("vep3x3")}
              className={clsx(
                "p-4 rounded-2xl border transition cursor-pointer flex items-start gap-4",
                selectedMethodology === "vep3x3"
                  ? "border-[#F04438] bg-red-50/40 ring-2 ring-red-500/20"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                  selectedMethodology === "vep3x3" ? "border-[#F04438] bg-[#F04438]" : "border-gray-300"
                )}
              >
                {selectedMethodology === "vep3x3" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-gray-900">
                    Valor Esperado de la Pérdida (VEP) — 3x3
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    DS 44 / ISL
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Permite evaluar los riesgos utilizando tres niveles de Probabilidad y tres niveles de Consecuencia.
                </p>
              </div>
            </div>

            {/* OPCIÓN 2: Matriz 5x5 */}
            <div
              onClick={() => setSelectedMethodology("matrix5x5")}
              className={clsx(
                "p-4 rounded-2xl border transition cursor-pointer flex items-start gap-4",
                selectedMethodology === "matrix5x5"
                  ? "border-[#F04438] bg-red-50/40 ring-2 ring-red-500/20"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                  selectedMethodology === "matrix5x5" ? "border-[#F04438] bg-[#F04438]" : "border-gray-300"
                )}
              >
                {selectedMethodology === "matrix5x5" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-gray-900">
                    Matriz de Riesgos 5x5
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    Escala 1 a 25
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Permite evaluar los riesgos mediante cinco niveles de Probabilidad y cinco niveles de Consecuencia, entregando una clasificación más detallada.
                </p>
              </div>
            </div>

            {/* OPCIÓN 3: Dinámica 5x5 + VEP */}
            <div
              onClick={() => setSelectedMethodology("dynamic5x5_vep")}
              className={clsx(
                "p-4 rounded-2xl border transition cursor-pointer flex items-start gap-4 relative overflow-hidden",
                selectedMethodology === "dynamic5x5_vep"
                  ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                  selectedMethodology === "dynamic5x5_vep" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                )}
              >
                {selectedMethodology === "dynamic5x5_vep" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-gray-900">
                    Evaluación Dinámica 5x5 + VEP
                  </h4>
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                    Recomendada para empresas que utilizan 5x5
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Permite trabajar habitualmente con una evaluación 5x5 y visualizar su equivalencia en formato VEP 3x3 cuando sea necesario.
                </p>
              </div>
            </div>
          </div>

          {/* ADVERTENCIA DE BLOQUEO PERMANENTE */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-6 flex items-start gap-3">
            <LuTriangleAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-amber-900 leading-relaxed">
              <strong className="block font-bold mb-0.5 text-amber-950">
                Advertencia importante:
              </strong>
              Esta configuración definirá la metodología de evaluación de riesgos utilizada por la organización y{" "}
              <strong>no podrá modificarse posteriormente</strong>, para garantizar la consistencia histórica y trazabilidad de las matrices.
              <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasConfirmedWarning}
                  onChange={(e) => setHasConfirmedWarning(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F04438] focus:ring-red-500 border-amber-300 cursor-pointer"
                />
                <span className="font-semibold text-amber-950">
                  Entiendo que esta metodología no podrá ser modificada tras su confirmación.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Botón de Confirmación Explícita y Configurar más tarde */}
        <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer text-center"
            >
              Configurar más tarde
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasConfirmedWarning}
            className="w-full sm:w-auto px-8 py-3 bg-[#F04438] hover:bg-[#D92D20] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-md shadow-red-700/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <LuCheck className="w-4 h-4 stroke-[3]" />
            <span>Confirmar metodología</span>
          </button>
        </div>
      </div>
    </div>
  );
}
