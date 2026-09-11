"use client";

import { useState, useMemo, useEffect } from "react";
import clsx from "clsx";
import {
  LuX,
  LuPrinter,
  LuFileText,
  LuShieldCheck,
  LuCircleCheck,
  LuClock,
  LuBriefcase,
  LuSearch,
  LuUserCheck,
} from "react-icons/lu";
import { IperMatrixItem } from "./IperMatrixView";
import { IperEvaluationRow } from "./IperMatrixDetailView";

interface IrlDocumentModalProps {
  matrix: IperMatrixItem;
  evaluations: IperEvaluationRow[];
  onClose: () => void;
}

interface WorkerSignatureRecord {
  id: string;
  name: string;
  rut: string;
  position: string;
  deliveryDate: string;
  status: "Firmado" | "Pendiente";
}

export default function IrlDocumentModal({
  matrix,
  evaluations,
  onClose,
}: IrlDocumentModalProps) {
  // Extraer cargos disponibles EXCLUSIVAMENTE de las evaluaciones reales de la matriz (Reqs 3, 4, 7)
  const availablePositions = useMemo(() => {
    const uniquePositions = new Set<string>();
    evaluations.forEach((ev) => {
      if (ev.cargo && typeof ev.cargo === "string") {
        ev.cargo
          .split(/[,/;•]/)
          .map((c) => c.trim())
          .filter(Boolean)
          .forEach((cargo) => uniquePositions.add(cargo));
      }
    });
    return Array.from(uniquePositions).sort((a, b) => a.localeCompare(b));
  }, [evaluations]);

  const [selectedPosition, setSelectedPosition] = useState<string>(
    () => availablePositions[0] || ""
  );

  // Sincronizar posición seleccionada si cambian las evaluaciones
  useEffect(() => {
    if (availablePositions.length > 0 && (!selectedPosition || !availablePositions.includes(selectedPosition))) {
      setSelectedPosition(availablePositions[0]);
    }
  }, [availablePositions, selectedPosition]);

  const [activeTab, setActiveTab] = useState<"document" | "signatures">("document");
  const [searchTerm, setSearchTerm] = useState("");

  // Lista de trabajadores del cargo para control de firmas
  const [workerSignatures, setWorkerSignatures] = useState<WorkerSignatureRecord[]>([
    {
      id: "w-1",
      name: "Juan Ignacio Morales Castro",
      rut: "15.423.891-K",
      position: availablePositions[0] || "Trabajador",
      deliveryDate: "2026-08-15",
      status: "Firmado",
    },
    {
      id: "w-2",
      name: "Rodrigo Esteban Tapia Silva",
      rut: "16.890.342-3",
      position: availablePositions[0] || "Trabajador",
      deliveryDate: "2026-08-18",
      status: "Pendiente",
    },
    {
      id: "w-3",
      name: "Valentina Andrea Muñoz Lagos",
      rut: "18.234.567-8",
      position: availablePositions[1] || availablePositions[0] || "Trabajador",
      deliveryDate: "2026-08-10",
      status: "Firmado",
    },
    {
      id: "w-4",
      name: "Cristóbal Andrés Vergara Soto",
      rut: "14.789.012-4",
      position: availablePositions[0] || "Trabajador",
      deliveryDate: "2026-08-20",
      status: "Firmado",
    },
  ]);

  const handleToggleWorkerStatus = (id: string) => {
    setWorkerSignatures((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: w.status === "Firmado" ? "Pendiente" : "Firmado" } : w
      )
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtrar evaluaciones relevantes EXCLUSIVAMENTE para el cargo seleccionado (Reqs 4, 5, 7)
  const positionEvaluations = useMemo(() => {
    if (!selectedPosition || evaluations.length === 0) return [];
    const target = selectedPosition.trim().toLowerCase();
    return evaluations.filter((ev) => {
      if (!ev.cargo) return false;
      const cargos = ev.cargo.split(/[,/;•]/).map((c) => c.trim().toLowerCase());
      return cargos.includes(target) || ev.cargo.toLowerCase().includes(target);
    });
  }, [evaluations, selectedPosition]);

  const filteredSignatures = workerSignatures.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const signedCount = workerSignatures.filter((w) => w.status === "Firmado").length;
  const signatureProgress = Math.round((signedCount / (workerSignatures.length || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden font-[family-name:var(--font-poppins)] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* 1. Header del Modal con Branding LifeOn */}
        <div className="bg-white border-b border-gray-200 text-gray-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center flex-shrink-0">
              <LuFileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold tracking-tight text-gray-900">
                  Información de Riesgos Laborales (IRL)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  Art. 21 D.S. 40 / D.S. 44
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Generado desde la Matriz Vigente: <strong className="text-teal-700 font-mono">{matrix.code}</strong> - {matrix.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition cursor-pointer shadow-xs"
              title="Imprimir documento IRL"
            >
              <LuPrinter className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Documento</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Barra de Navegación del Modal e Indicadores de Cargo */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-700 whitespace-nowrap flex items-center gap-1.5">
              <LuBriefcase className="w-4 h-4 text-teal-600" />
              Seleccionar Cargo / Puesto:
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="bg-white border border-teal-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
            >
              {availablePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-gray-200/80 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("document")}
                className={clsx(
                  "px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5",
                  activeTab === "document"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <LuFileText className="w-3.5 h-3.5 text-teal-600" />
                Información de Riesgos Laborales (IRL)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("signatures")}
                className={clsx(
                  "px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5",
                  activeTab === "signatures"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <LuUserCheck className="w-3.5 h-3.5 text-teal-600" />
                Control de Entrega y Firmas ({signedCount}/{workerSignatures.length})
              </button>
            </div>
          </div>
        </div>

        {/* 3. Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50">
          {activeTab === "document" ? (
            /* FICHA DEL IRL LISTA PARA IMPRIMIR */
            <div className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-2xl shadow-md p-6 sm:p-10 text-gray-800 flex flex-col gap-6 print:shadow-none print:border-none print:p-0">
              {/* Encabezado Corporativo Formal */}
              <div className="border-b-2 border-gray-900 pb-4 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-[#F04438] tracking-tight">Life</span>
                    <span className="text-xl font-black text-[#0D9488] tracking-tight">On</span>
                    <span className="text-xs font-mono font-bold text-gray-500 ml-2">SST DIGITAL</span>
                  </div>
                  <h1 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight mt-1">
                    INFORMACIÓN DE RIESGOS LABORALES (IRL)
                  </h1>
                  <p className="text-[11px] text-gray-600">
                    En cumplimiento del Artículo 21 del D.S. N° 40 (Ley 16.744) y Directrices del D.S. N° 44
                  </p>
                </div>

                <div className="text-right text-[11px] font-mono border-l border-gray-200 pl-4">
                  <p><strong className="text-gray-900">Código Doc:</strong> IRL-{matrix.code}-{selectedPosition.slice(0, 3).toUpperCase()}</p>
                  <p><strong className="text-gray-900">Versión:</strong> 1.0 (Vigente)</p>
                  <p><strong className="text-gray-900">Fecha Emisión:</strong> {new Date().toLocaleDateString("es-CL")}</p>
                </div>
              </div>

              {/* Antecedentes Generales y del Trabajador */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Empresa / Razón Social</span>
                  <span className="font-bold text-gray-900">LifeOn Soluciones SpA / Empresa Mandante</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Centro de Trabajo / Faena</span>
                  <span className="font-bold text-gray-900">{matrix.workCenter}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Cargo / Puesto de Trabajo Evaluado</span>
                  <span className="font-black text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 inline-block">
                    {selectedPosition}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Responsable de Prevención (APR)</span>
                  <span className="font-semibold text-gray-900">{matrix.responsible}</span>
                </div>
              </div>

              {/* Declaración de Obligación Legal */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <LuShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0" />
                  Obligación de Informar los Riesgos Laborales (Art. 21 D.S. N° 40):
                </p>
                <p className="text-[11px] text-blue-900">
                  La empresa informa oportunamente al trabajador sobre los peligros que entrañan sus labores asignadas, los riesgos específicos a los que estará expuesto, las consecuencias para su salud y las medidas preventivas, métodos correctos de trabajo y EPP obligatorios que debe cumplir rigurosamente.
                </p>
              </div>

              {/* Matriz de Riesgos y Controles Específicos del Cargo */}
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>1. Inventario de Peligros, Riesgos y Medidas Preventivas del Cargo</span>
                  <span className="text-[10px] text-gray-500 font-normal font-mono">
                    {positionEvaluations.length} riesgo(s) asociado(s)
                  </span>
                </h4>

                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-200 text-[11px]">
                        <th className="p-2.5 border-r border-gray-200 w-1/4">Tarea / Operación</th>
                        <th className="p-2.5 border-r border-gray-200 w-1/4">Peligro y Riesgo Asociado</th>
                        <th className="p-2.5 border-r border-gray-200 w-1/5">Posibles Consecuencias</th>
                        <th className="p-2.5">Medidas Preventivas / Métodos de Trabajo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-[11px]">
                      {positionEvaluations.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-400 italic">
                            No hay evaluaciones registradas para este cargo en la matriz.
                          </td>
                        </tr>
                      ) : (
                        positionEvaluations.map((ev, idx) => (
                          <tr key={ev.id || idx} className="hover:bg-gray-50/70">
                            <td className="p-2.5 border-r border-gray-200 align-top">
                              <strong className="text-gray-900 block font-semibold">{ev.task}</strong>
                              <span className="text-[10px] text-gray-500 block mt-0.5">Proceso: {ev.process}</span>
                            </td>
                            <td className="p-2.5 border-r border-gray-200 align-top">
                              <span className="text-gray-800 font-medium block">⚠️ {ev.hazard}</span>
                              <span className="inline-block mt-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                {ev.riskEvent}
                              </span>
                            </td>
                            <td className="p-2.5 border-r border-gray-200 align-top text-gray-700">
                              {ev.initialLevel === "Crítico"
                                ? "Muerte, invalidez total, traumatismo severo, atrapamiento."
                                : ev.initialLevel === "Alto"
                                ? "Fracturas, quemaduras graves, daño musculoesquelético o auditivo."
                                : "Contusiones, cortes menores, fatiga o irritación temporal."}
                            </td>
                            <td className="p-2.5 align-top text-gray-800">
                              <p className="leading-snug">{ev.controls}</p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Elementos de Protección Personal (EPP) Obligatorios */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  2. Elementos de Protección Personal (EPP) de Uso Obligatorio
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-gray-200 flex items-center gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>Casco de seguridad dieléctrico</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-gray-200 flex items-center gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>Calzado de seguridad certificado</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-gray-200 flex items-center gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>Lentes de seguridad con filtro UV</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-gray-200 flex items-center gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>Guantes de protección mecánica</span>
                  </div>
                </div>
              </div>

              {/* 3. Declaración de Recepción y Toma de Conocimiento (Firma del Trabajador) */}
              <div className="border-t-2 border-gray-800 pt-5 flex flex-col gap-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  3. Declaración de Recepción y Conformidad del Trabajador
                </h4>
                <p className="text-[11px] text-gray-700 leading-relaxed">
                  Declaro haber recibido, leído y comprendido la presente Información de Riesgos Laborales (IRL) correspondiente a mi cargo de <strong>{selectedPosition}</strong>. Me comprometo a cumplir estrictamente con los procedimientos de trabajo seguro, el uso permanente y adecuado de mis Elementos de Protección Personal (EPP), y a informar inmediatamente cualquier condición o acto subestándar a mi jefatura directa.
                </p>

                {/* Bloque de Firmas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 pb-2">
                  <div className="border-t border-gray-400 pt-2 flex flex-col text-xs text-center">
                    <span className="font-bold text-gray-900">FIRMA DEL TRABAJADOR / TRABAJADORA</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Nombre: _____________________________________</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">RUT: ____________________ Fecha: ___/___/2026</span>
                  </div>

                  <div className="border-t border-gray-400 pt-2 flex flex-col text-xs text-center">
                    <span className="font-bold text-gray-900">POR LA EMPRESA / PREVENCIONISTA (APR)</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Nombre: {matrix.responsible}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Firma y Timbre Departamento SST</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PANEL DE CONTROL DE FIRMAS Y ENTREGAS */
            <div className="max-w-4xl mx-auto flex flex-col gap-4">
              {/* Tarjeta de Progreso de Firmas */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-black text-base flex-shrink-0">
                    {signatureProgress}%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Cumplimiento Legal de Entrega IRL</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {signedCount} de {workerSignatures.length} trabajadores de la dotación con documento IRL firmado.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {signedCount} Firmados
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {workerSignatures.length - signedCount} Pendientes
                  </span>
                </div>
              </div>

              {/* Buscador y Tabla de Trabajadores */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[240px]">
                    <LuSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, RUT o cargo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <span className="text-xs text-gray-500">
                    Mostrando {filteredSignatures.length} registros
                  </span>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 text-[11px]">
                        <th className="p-3">Trabajador / RUT</th>
                        <th className="p-3">Cargo Asignado</th>
                        <th className="p-3">Fecha Entrega</th>
                        <th className="p-3">Estado de Firma</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSignatures.map((w) => (
                        <tr key={w.id} className="hover:bg-gray-50/60">
                          <td className="p-3">
                            <p className="font-bold text-gray-900">{w.name}</p>
                            <p className="text-[11px] text-gray-500 font-mono">{w.rut}</p>
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-gray-800">{w.position}</span>
                          </td>
                          <td className="p-3 text-gray-600 font-mono text-[11px]">
                            {w.deliveryDate}
                          </td>
                          <td className="p-3">
                            <span
                              className={clsx(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                w.status === "Firmado"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              )}
                            >
                              {w.status === "Firmado" ? (
                                <>
                                  <LuCircleCheck className="w-3 h-3" /> Firmado
                                </>
                              ) : (
                                <>
                                  <LuClock className="w-3 h-3" /> Pendiente
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleWorkerStatus(w.id)}
                              className="px-3 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition cursor-pointer"
                            >
                              {w.status === "Firmado" ? "Marcar Pendiente" : "Registrar Firma"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
