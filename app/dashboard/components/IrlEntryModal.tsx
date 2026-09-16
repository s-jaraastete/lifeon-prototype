"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { LuX, LuFileText, LuBriefcase, LuChevronRight } from "react-icons/lu";
import { IperMatrixItem } from "./IperMatrixView";
import { IperEvaluationRow } from "./IperMatrixDetailView";

type IrlEntryModalProps = {
  isOpen: boolean;
  matrices: IperMatrixItem[];
  onClose: () => void;
  onOpenIrl: (matrix: IperMatrixItem, cargoName: string) => void;
};

function parseCargosFromEvaluations(evaluations: IperEvaluationRow[]): string[] {
  const set = new Set<string>();
  evaluations.forEach((ev) => {
    if (!ev.cargo || typeof ev.cargo !== "string") return;
    ev.cargo
      .split(/[,/;•]/)
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c) => set.add(c));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export default function IrlEntryModal({
  isOpen,
  matrices,
  onClose,
  onOpenIrl,
}: IrlEntryModalProps) {
  const [step, setStep] = useState<"matrix" | "cargo">("matrix");
  const [selectedMatrix, setSelectedMatrix] = useState<IperMatrixItem | null>(null);

  const evaluations = useMemo(() => {
    if (!selectedMatrix) return [];
    return selectedMatrix.evaluations || [];
  }, [selectedMatrix]);

  const cargos = useMemo(() => parseCargosFromEvaluations(evaluations), [evaluations]);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep("matrix");
    setSelectedMatrix(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Información de Riesgos Laborales</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {step === "matrix"
                ? "Paso 1: Selecciona una matriz vigente"
                : "Paso 2: Selecciona el cargo"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl cursor-pointer"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {step === "matrix" && (
            <>
              {matrices.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">
                  No hay matrices con estado Vigente. Aprueba una matriz para generar IRL.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {matrices.map((mat) => (
                    <li key={mat.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMatrix(mat);
                          setStep("cargo");
                        }}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/40 transition text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <LuFileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{mat.name || mat.title}</p>
                            <p className="text-[11px] text-gray-500 font-mono">{mat.code}</p>
                          </div>
                        </div>
                        <LuChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {step === "cargo" && selectedMatrix && (
            <>
              <button
                type="button"
                onClick={() => setStep("matrix")}
                className="text-xs font-semibold text-teal-700 mb-3 cursor-pointer hover:underline"
              >
                ← Cambiar matriz
              </button>
              {cargos.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Esta matriz no tiene cargos asociados en sus evaluaciones.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {cargos.map((cargo) => (
                    <li key={cargo}>
                      <button
                        type="button"
                        onClick={() => onOpenIrl(selectedMatrix, cargo)}
                        className={clsx(
                          "w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200",
                          "hover:border-teal-300 hover:bg-teal-50/40 transition text-left cursor-pointer"
                        )}
                      >
                        <LuBriefcase className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-semibold text-gray-900">{cargo}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
