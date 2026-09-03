"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  LuX,
  LuClipboardCheck,
  LuShieldAlert,
  LuCheck,
  LuTriangleAlert,
  LuCircleX,
  LuInfo,
  LuFileText,
  LuCheckCheck,
} from "react-icons/lu";
import { PreventiveDoc, AuditPoint, AuditPointStatus } from "@/types/preventiveDocs";

interface DocAuditModalProps {
  isOpen: boolean;
  doc: PreventiveDoc | null;
  onClose: () => void;
  onUpdatePoint: (
    docId: string,
    pointId: string,
    status: AuditPointStatus,
    notes?: string
  ) => void;
}

export default function DocAuditModal({
  isOpen,
  doc,
  onClose,
  onUpdatePoint,
}: DocAuditModalProps) {
  if (!isOpen || !doc) return null;

  // Estado local para edición rápida antes de guardar o sincronización directa
  const [activeTab, setActiveTab] = useState<"todos" | "pendientes" | "criticos">("todos");

  const filteredPoints = doc.auditChecklist.filter((pt) => {
    if (activeTab === "criticos") return pt.criticality === "Crítico";
    if (activeTab === "pendientes") return pt.status === "Observado" || pt.status === "No Cumple";
    return true;
  });

  const totalPoints = doc.auditChecklist.filter((p) => p.status !== "No Aplica").length;
  const passedPoints = doc.auditChecklist.filter((p) => p.status === "Cumple").length;
  const observedPoints = doc.auditChecklist.filter((p) => p.status === "Observado").length;
  const failedPoints = doc.auditChecklist.filter((p) => p.status === "No Cumple").length;
  const hasCriticalFails = doc.auditChecklist.some(
    (p) => p.criticality === "Crítico" && (p.status === "No Cumple" || p.status === "Observado")
  );

  const handleMarkAllPassed = () => {
    doc.auditChecklist.forEach((pt) => {
      if (pt.status !== "No Aplica") {
        onUpdatePoint(doc.id, pt.id, "Cumple");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 via-white to-teal-50/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <LuClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                  {doc.code}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {doc.category}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  {doc.version}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                Auditoría Normativa: {doc.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <LuFileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Base legal fiscalizable: <strong className="text-gray-700">{doc.regulatoryBasis}</strong></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Puntaje y KPIs de Cumplimiento */}
        <div className="px-5 sm:px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span>Conformidad del Documento:</span>
                <span
                  className={clsx(
                    "text-xs font-extrabold px-2 py-0.5 rounded-md",
                    doc.auditScore >= 90
                      ? "bg-emerald-100 text-emerald-800"
                      : doc.auditScore >= 70
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  )}
                >
                  {doc.auditScore}%
                </span>
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                {passedPoints} de {totalPoints} puntos conformes
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-300",
                  doc.auditScore >= 90
                    ? "bg-emerald-500"
                    : doc.auditScore >= 70
                    ? "bg-amber-500"
                    : "bg-red-500"
                )}
                style={{ width: `${doc.auditScore}%` }}
              />
            </div>
          </div>

          {/* Estado ante Fiscalización */}
          <div className="flex items-center gap-2 sm:border-l sm:border-gray-200 sm:pl-4">
            <div className="text-right sm:text-left">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                Riesgo de Multa (DT / SEREMI)
              </span>
              <span
                className={clsx(
                  "text-xs font-bold inline-flex items-center gap-1 mt-0.5",
                  hasCriticalFails
                    ? "text-red-700"
                    : observedPoints > 0
                    ? "text-amber-700"
                    : "text-emerald-700"
                )}
              >
                {hasCriticalFails ? (
                  <>
                    <LuTriangleAlert className="w-3.5 h-3.5 text-red-600" />
                    Riesgo Alto (Causales críticas)
                  </>
                ) : observedPoints > 0 ? (
                  <>
                    <LuInfo className="w-3.5 h-3.5 text-amber-600" />
                    Riesgo Medio (Observaciones menores)
                  </>
                ) : (
                  <>
                    <LuCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Bajo Riesgo (100% Conforme)
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas de Filtrado de Criterios y Acción Rápida */}
        <div className="px-5 sm:px-6 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("todos")}
              className={clsx(
                "px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer",
                activeTab === "todos"
                  ? "bg-teal-600 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Todos ({doc.auditChecklist.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pendientes")}
              className={clsx(
                "px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer",
                activeTab === "pendientes"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Con Brechas ({observedPoints + failedPoints})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("criticos")}
              className={clsx(
                "px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer",
                activeTab === "criticos"
                  ? "bg-red-600 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Críticos ({doc.auditChecklist.filter((p) => p.criticality === "Crítico").length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleMarkAllPassed}
            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
          >
            <LuCheckCheck className="w-3.5 h-3.5" />
            Marcar todos como Conforme
          </button>
        </div>

        {/* Lista de Puntos Auditables */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-gray-50/40">
          {filteredPoints.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 text-gray-500 text-xs">
              No hay puntos en este filtro. Todos los criterios cumplen satisfactoriamente.
            </div>
          ) : (
            filteredPoints.map((pt, index) => {
              return (
                <div
                  key={pt.id}
                  className={clsx(
                    "bg-white rounded-2xl p-4 border transition flex flex-col gap-3 shadow-2xs",
                    pt.status === "Cumple" && "border-gray-200 hover:border-teal-300",
                    pt.status === "Observado" && "border-amber-300 bg-amber-50/20",
                    pt.status === "No Cumple" && "border-red-300 bg-red-50/20",
                    pt.status === "No Aplica" && "border-gray-200 opacity-60"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 font-mono font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-gray-500">
                            {pt.code}
                          </span>
                          <span
                            className={clsx(
                              "text-[10px] font-extrabold px-2 py-0.5 rounded-md",
                              pt.criticality === "Crítico" && "bg-red-50 text-red-700 border border-red-200",
                              pt.criticality === "Mayor" && "bg-amber-50 text-amber-700 border border-amber-200",
                              pt.criticality === "Menor" && "bg-blue-50 text-blue-700 border border-blue-200"
                            )}
                          >
                            Prioridad {pt.criticality}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1">
                          {pt.requirement}
                        </p>
                        <p className="text-[11px] text-teal-800 font-medium mt-0.5">
                          Exigencia: {pt.normativeReference}
                        </p>
                      </div>
                    </div>

                    {/* Selector de Estado */}
                    <div className="flex items-center gap-1 self-end sm:self-start bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => onUpdatePoint(doc.id, pt.id, "Cumple")}
                        className={clsx(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                          pt.status === "Cumple"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-gray-600 hover:text-emerald-700"
                        )}
                        title="Cumple con el requisito normativo"
                      >
                        <LuCheck className="w-3.5 h-3.5" />
                        <span>Cumple</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdatePoint(doc.id, pt.id, "Observado")}
                        className={clsx(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                          pt.status === "Observado"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "text-gray-600 hover:text-amber-700"
                        )}
                        title="Cumplimiento parcial o con observaciones menores"
                      >
                        <LuTriangleAlert className="w-3.5 h-3.5" />
                        <span>Observado</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdatePoint(doc.id, pt.id, "No Cumple")}
                        className={clsx(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                          pt.status === "No Cumple"
                            ? "bg-red-600 text-white shadow-xs"
                            : "text-gray-600 hover:text-red-700"
                        )}
                        title="No cumple - Causal de sanción"
                      >
                        <LuCircleX className="w-3.5 h-3.5" />
                        <span>No Cumple</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdatePoint(doc.id, pt.id, "No Aplica")}
                        className={clsx(
                          "px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer",
                          pt.status === "No Aplica"
                            ? "bg-gray-400 text-white shadow-xs"
                            : "text-gray-400 hover:text-gray-700"
                        )}
                        title="No aplica a esta faena"
                      >
                        N/A
                      </button>
                    </div>
                  </div>

                  {/* Hallazgo / Evidencia Verificada */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                        Evidencia Verificada / Hallazgo de Auditoría:
                      </label>
                      <input
                        type="text"
                        defaultValue={pt.notes || ""}
                        onBlur={(e) => onUpdatePoint(doc.id, pt.id, pt.status, e.target.value)}
                        placeholder="Ej: Registro firmado archivado en carpeta / Pendiente actualizar lista..."
                        className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition"
                      />
                    </div>
                    {pt.lastAuditedDate && (
                      <span className="text-[10px] text-gray-400 self-end sm:self-auto font-mono">
                        Última auditoría: {pt.lastAuditedDate}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Los cambios en las evaluaciones se guardan de forma automática en el sistema.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer shadow-xs"
          >
            Finalizar y Guardar Auditoría
          </button>
        </div>
      </div>
    </div>
  );
}
