"use client";

import React, { useState } from "react";
import clsx from "clsx";
import {
  LuFileCheck,
  LuSparkles,
  LuUpload,
  LuCheck,
  LuLayers,
  LuFolderPlus,
  LuArrowRight,
  LuFileText,
  LuX,
} from "react-icons/lu";

interface PreventivePlanningOnboardingModalProps {
  isOpen: boolean;
  onSelectOption: (hasExistingProgram: boolean, setupMode: "upload_existing" | "create_base") => void;
  onClose?: () => void;
}

export default function PreventivePlanningOnboardingModal({
  isOpen,
  onSelectOption,
  onClose,
}: PreventivePlanningOnboardingModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<"yes" | "no">("no");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedChoice === "yes") {
      onSelectOption(true, "upload_existing");
    } else {
      onSelectOption(false, "create_base");
    }
  };

  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setSelectedChoice("yes");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 font-[family-name:var(--font-poppins)] select-none overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200 relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            title="Cerrar modal"
          >
            <LuX className="w-5 h-5" />
          </button>
        )}
        <div>
          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-4 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
              <LuFileCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Configuración Inicial de Módulo
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                ¿Su organización ya cuenta con un Programa de Trabajo en Gestión de Riesgos Laborales?
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
            El Programa de Trabajo es el eje operativo para planificar, asignar, ejecutar, evidenciar y medir el cumplimiento preventivo en LifeOn.
          </p>

          <div className="flex flex-col gap-3 mb-6">
            {/* Opción 1: Sí, ya contamos con uno */}
            <div
              onClick={() => setSelectedChoice("yes")}
              className={clsx(
                "p-4 rounded-2xl border transition cursor-pointer flex items-start gap-4",
                selectedChoice === "yes"
                  ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                  selectedChoice === "yes" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                )}
              >
                {selectedChoice === "yes" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-gray-900">
                    Sí, ya contamos con uno
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    Cargar programa
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Podrás cargar tu programa anual actual y estructurar sus actividades para hacer seguimiento y adjuntar evidencias directas en LifeOn.
                </p>

                {selectedChoice === "yes" && (
                  <div className="mt-3 pt-3 border-t border-teal-100 flex items-center gap-3">
                    <label className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-2xs">
                      <LuUpload className="w-3.5 h-3.5" />
                      <span>{uploadedFileName ? "Cambiar archivo" : "Seleccionar archivo"}</span>
                      <input
                        type="file"
                        accept=".pdf,.xlsx,.csv,.docx"
                        onChange={handleSimulatedFileUpload}
                        className="hidden"
                      />
                    </label>
                    {uploadedFileName ? (
                      <span className="text-xs text-teal-900 font-medium truncate max-w-[200px]">
                        ✓ {uploadedFileName}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">
                        Soporta PDF, XLSX o DOCX
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Opción 2: No, queremos crear uno en LifeOn */}
            <div
              onClick={() => setSelectedChoice("no")}
              className={clsx(
                "p-4 rounded-2xl border transition cursor-pointer flex items-start gap-4",
                selectedChoice === "no"
                  ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                  selectedChoice === "no" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                )}
              >
                {selectedChoice === "no" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-gray-900">
                    No, queremos crear uno en LifeOn
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                    Crear programa base
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Generaremos un Programa de Trabajo base demostrativo, estructurado con capacitaciones, inspecciones y requerimientos operativos que podrás editar libremente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Confirmación y Configurar más tarde */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Configurar más tarde
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-teal-700/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{selectedChoice === "yes" ? "Cargar y estructurar programa" : "Generar programa base"}</span>
            <LuArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
