"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import {
  LuFileText,
  LuUpload,
  LuDownload,
  LuSearch,
  LuFilter,
  LuCircleCheck,
  LuClock,
  LuCircleAlert,
  LuPlus,
  LuCalendar,
  LuCheck,
  LuX,
  LuEye,
  LuClipboardCheck,
  LuShieldAlert,
  LuTriangleAlert,
  LuSquarePen,
  LuFolderArchive,
  LuSparkles,
  LuRotateCcw,
  LuExternalLink,
  LuCheckCheck,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import {
  PreventiveDoc,
  DocCategory,
  DocStatus,
  AuditPointStatus,
  DocSection,
} from "@/types/preventiveDocs";
import { usePreventiveDocs } from "@/hooks/usePreventiveDocs";
import DocAuditModal from "./DocAuditModal";
import DocEditorModal from "./DocEditorModal";
import DocUploadModal from "./DocUploadModal";

export default function PreventiveDocsView() {
  const {
    docs,
    updateDoc,
    uploadCustomFile,
    updateAuditPoint,
    updateDocSections,
    addDocument,
    deleteDocument,
    resetToDefaults,
    metrics,
  } = usePreventiveDocs();

  // Estado de Navegación Principal del Módulo: Gestión Documental vs Auditoría
  const [mainViewMode, setMainViewMode] = useState<"gestion" | "auditoria">("gestion");

  // Filtros de Gestión Documental
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [activeVigencia, setActiveVigencia] = useState<string>("Todos");
  const [search, setSearch] = useState("");

  // Paginación: Diseñada para evitar barras de desplazamiento vertical
  const [docPage, setDocPage] = useState(1);
  const [docPageSize, setDocPageSize] = useState<number>(4);

  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState<number>(3);

  // Modales
  const [selectedAuditDoc, setSelectedAuditDoc] = useState<PreventiveDoc | null>(null);
  const [selectedEditorDoc, setSelectedEditorDoc] = useState<PreventiveDoc | null>(null);
  const [selectedUploadDoc, setSelectedUploadDoc] = useState<PreventiveDoc | null>(null);
  const [isNewDocUploadOpen, setIsNewDocUploadOpen] = useState(false);

  // Reiniciar a la primera página cuando cambian los filtros
  useEffect(() => {
    setDocPage(1);
    setAuditPage(1);
  }, [activeCategory, activeVigencia, search]);

  // Filtrado de Documentos
  const filteredDocs = docs.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.regulatoryBasis.toLowerCase().includes(search.toLowerCase()) ||
      d.author.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "Todos" || d.category === activeCategory;

    const matchesVigencia =
      activeVigencia === "Todos" || d.status === activeVigencia;

    return matchesSearch && matchesCategory && matchesVigencia;
  });

  // Paginación Gestión Documental
  const totalDocPages = Math.max(1, Math.ceil(filteredDocs.length / docPageSize));
  const currentDocPage = Math.min(docPage, totalDocPages);
  const startDocIndex = (currentDocPage - 1) * docPageSize;
  const paginatedDocs = filteredDocs.slice(startDocIndex, startDocIndex + docPageSize);

  // Paginación Auditoría
  const totalAuditPages = Math.max(1, Math.ceil(docs.length / auditPageSize));
  const currentAuditPage = Math.min(auditPage, totalAuditPages);
  const startAuditIndex = (currentAuditPage - 1) * auditPageSize;
  const paginatedAuditDocs = docs.slice(startAuditIndex, startAuditIndex + auditPageSize);

  // Lista de brechas críticas de auditoría
  const criticalBreachesList = docs.flatMap((doc) =>
    doc.auditChecklist
      .filter(
        (pt) =>
          pt.criticality === "Crítico" &&
          (pt.status === "No Cumple" || pt.status === "Observado")
      )
      .map((pt) => ({ doc, pt }))
  );

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-300">
      {/* 1. Encabezado Compacto */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              Planificación y Documentación Preventiva
            </h2>
            <span className="bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              {metrics.globalComplianceScore}% Conformidad Global
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
            Gestión documental centralizada, vigencias y auditoría de cumplimiento normativo ante fiscalización (DT, SEREMI de Salud, SUSESO, DS 44).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "¿Deseas restablecer el catálogo de 12 documentos base normativos predeterminados?"
                )
              ) {
                resetToDefaults();
              }
            }}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            title="Restablecer documentos base de normativa chilena"
          >
            <LuRotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsNewDocUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition cursor-pointer"
          >
            <LuUpload className="w-3.5 h-3.5" />
            Cargar Documento Propio
          </button>
        </div>
      </div>

      {/* 2. Barra de Métricas KPI Compacta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* KPI 1: Cumplimiento Normativo Global */}
        <div className="bg-white rounded-xl p-3 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Auditoría Global
            </span>
            <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center text-xs">
              <LuClipboardCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-xl font-black text-teal-900">
              {metrics.globalComplianceScore}%
            </p>
            <span className="text-[10px] text-gray-500 font-medium">
              {metrics.passedPoints}/{metrics.totalPoints} conformes
            </span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${metrics.globalComplianceScore}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Control de Vigencias */}
        <div className="bg-white rounded-xl p-3 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Estado Vigencias
            </span>
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs">
              <LuClock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <p className="text-xl font-black text-emerald-700">
              {metrics.vigentesCount}
            </p>
            <span className="text-[11px] font-semibold text-gray-500">
              / {metrics.totalDocs} vigentes
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
            {metrics.porVencerCount > 0 && (
              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                {metrics.porVencerCount} por vencer
              </span>
            )}
            {metrics.vencidosCount > 0 ? (
              <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                {metrics.vencidosCount} vencidos
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">0 vencidos</span>
            )}
          </div>
        </div>

        {/* KPI 3: Brechas Críticas de Fiscalización */}
        <div className="bg-white rounded-xl p-3 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Brechas Críticas
            </span>
            <span
              className={clsx(
                "w-6 h-6 rounded-lg flex items-center justify-center text-xs",
                metrics.criticalBreaches > 0
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-700"
              )}
            >
              <LuShieldAlert className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p
              className={clsx(
                "text-xl font-black",
                metrics.criticalBreaches > 0 ? "text-[#F04438]" : "text-gray-900"
              )}
            >
              {metrics.criticalBreaches}
            </p>
            <span
              className={clsx(
                "text-[10px] font-medium",
                metrics.criticalBreaches > 0 ? "text-red-700 font-bold" : "text-gray-500"
              )}
            >
              {metrics.criticalBreaches > 0 ? "Riesgo de multa DT" : "100% Conforme"}
            </span>
          </div>
          <div className="text-[10px] text-gray-400 mt-1.5 truncate">
            {metrics.criticalBreaches > 0 ? "Requiere subsanación inmediata" : "Sin brechas normativas"}
          </div>
        </div>

        {/* KPI 4: Catálogo Base Normativo */}
        <div className="bg-white rounded-xl p-3 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Catálogo Normativo
            </span>
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs">
              <LuFileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-xl font-black text-gray-900">12 de 12</p>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded">
              DS 44 • Karin
            </span>
          </div>
          <div className="text-[10px] text-gray-400 mt-1.5">
            Exigencias normativas cubiertas
          </div>
        </div>
      </div>

      {/* 3. Selector de Modo: Gestión Documental vs Auditoría */}
      <div className="flex items-center justify-between border-b border-gray-200/80 gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setMainViewMode("gestion")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer",
              mainViewMode === "gestion"
                ? "border-teal-600 text-teal-800"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            <LuFolderArchive className="w-4 h-4" />
            <span>Gestión Documental y Vigencias</span>
            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {docs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainViewMode("auditoria")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer",
              mainViewMode === "auditoria"
                ? "border-teal-600 text-teal-800"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            <LuClipboardCheck className="w-4 h-4" />
            <span>Auditoría y Fiscalización</span>
            {metrics.criticalBreaches > 0 && (
              <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                {metrics.criticalBreaches} alertas
              </span>
            )}
          </button>
        </div>

        {/* Selector de Tamaño de Página */}
        {mainViewMode === "gestion" && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <span className="text-[11px]">Mostrar:</span>
            <select
              value={docPageSize}
              onChange={(e) => {
                setDocPageSize(Number(e.target.value));
                setDocPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-gray-700 focus:outline-none"
            >
              <option value={4}>4 por pág.</option>
              <option value={6}>6 por pág.</option>
              <option value={12}>12 por pág.</option>
            </select>
          </div>
        )}
      </div>

      {/* =========================================================================
          VISTA 1: GESTIÓN DOCUMENTAL Y VIGENCIAS (CON PAGINACIÓN)
          ========================================================================= */}
      {mainViewMode === "gestion" && (
        <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
          {/* Barra Compacta de Filtros y Búsqueda */}
          <div className="bg-white rounded-xl p-2.5 shadow-xs border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-2.5">
            {/* Categorías */}
            <div className="flex items-center gap-1 w-full lg:w-auto overflow-x-auto pb-0.5">
              {[
                "Todos",
                "Programa Anual SST",
                "Reglamento Interno",
                "Plan de Emergencia",
                "Procedimiento PTS",
                "Protocolo Minsal",
                "Registro Obligatorio",
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex-shrink-0",
                    activeCategory === cat
                      ? "bg-teal-600 text-white shadow-2xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Selector de Vigencia y Buscador */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <select
                value={activeVigencia}
                onChange={(e) => setActiveVigencia(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="Todos">Todas vigencias</option>
                <option value="Vigente">Vigentes</option>
                <option value="Por Vencer">Por Vencer (&lt;30d)</option>
                <option value="Vencido">Vencidos</option>
                <option value="Pendiente de Carga">Pendientes</option>
              </select>

              <div className="relative flex-1 sm:w-56">
                <LuSearch className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar documento o norma..."
                  className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg pl-8 pr-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-800 placeholder-gray-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Documentos Paginada */}
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-100 flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3.5">Código / Documento</th>
                    <th className="py-2.5 px-3.5">Categoría y Base Legal</th>
                    <th className="py-2.5 px-3.5">Origen</th>
                    <th className="py-2.5 px-3.5">Vigencia</th>
                    <th className="py-2.5 px-3.5">Auditoría</th>
                    <th className="py-2.5 px-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No se encontraron documentos en esta vista.
                      </td>
                    </tr>
                  ) : (
                    paginatedDocs.map((doc) => {
                      const isVigente = doc.status === "Vigente";
                      const isPorVencer = doc.status === "Por Vencer";
                      const isVencido = doc.status === "Vencido";

                      return (
                        <tr
                          key={doc.id}
                          className="hover:bg-teal-50/20 transition group"
                        >
                          {/* Código y Título */}
                          <td className="py-2.5 px-3.5 max-w-xs sm:max-w-sm">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                                <LuFileText className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[10px] font-bold text-teal-900 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                                    {doc.code}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {doc.version}
                                  </span>
                                </div>
                                <p className="font-bold text-gray-900 text-xs mt-0.5 truncate">
                                  {doc.title}
                                </p>
                                <span className="text-[10px] text-gray-400 block truncate">
                                  Resp: {doc.author}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Categoría y Base Legal */}
                          <td className="py-2.5 px-3.5">
                            <span className="font-semibold text-gray-800 block text-xs">
                              {doc.category}
                            </span>
                            <span className="text-[10px] text-teal-800 font-medium line-clamp-1 mt-0.5">
                              ⚖️ {doc.regulatoryBasis}
                            </span>
                          </td>

                          {/* Origen */}
                          <td className="py-2.5 px-3.5">
                            <span
                              className={clsx(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1",
                                doc.source === "Plantilla del Sistema"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              )}
                            >
                              {doc.source === "Plantilla del Sistema" ? (
                                <>
                                  <LuSparkles className="w-2.5 h-2.5 text-blue-600" />
                                  Plantilla Base
                                </>
                              ) : (
                                <>
                                  <LuUpload className="w-2.5 h-2.5 text-emerald-600" />
                                  Archivo Empresa
                                </>
                              )}
                            </span>
                          </td>

                          {/* Vigencia */}
                          <td className="py-2.5 px-3.5">
                            <span
                              className={clsx(
                                "px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs",
                                isVigente && "bg-emerald-50 text-emerald-800 border border-emerald-200",
                                isPorVencer && "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse",
                                isVencido && "bg-red-50 text-red-800 border border-red-200"
                              )}
                            >
                              <span
                                className={clsx(
                                  "w-1.5 h-1.5 rounded-full",
                                  isVigente && "bg-emerald-500",
                                  isPorVencer && "bg-amber-500",
                                  isVencido && "bg-red-500"
                                )}
                              />
                              {doc.status}
                              {doc.daysRemaining !== undefined && doc.daysRemaining < 365 && doc.daysRemaining >= 0 && (
                                <span>({doc.daysRemaining}d)</span>
                              )}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">
                              Vence: {doc.expiryDate}
                            </span>
                          </td>

                          {/* Auditoría */}
                          <td className="py-2.5 px-3.5">
                            <button
                              type="button"
                              onClick={() => setSelectedAuditDoc(doc)}
                              className="text-left group/aud cursor-pointer"
                            >
                              <span
                                className={clsx(
                                  "px-2 py-0.5 rounded text-[10px] font-black inline-flex items-center gap-1 transition",
                                  doc.auditScore >= 90
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 group-hover/aud:bg-emerald-100"
                                    : doc.auditScore >= 70
                                    ? "bg-amber-50 text-amber-800 border border-amber-200 group-hover/aud:bg-amber-100"
                                    : "bg-red-50 text-red-800 border border-red-200 group-hover/aud:bg-red-100"
                                )}
                              >
                                {doc.auditScore}%
                                <span className="font-normal text-[9px]">
                                  ({doc.auditStatus})
                                </span>
                              </span>
                              <span className="text-[10px] text-teal-700 font-semibold block mt-0.5 group-hover/aud:underline">
                                Auditar →
                              </span>
                            </button>
                          </td>

                          {/* Acciones */}
                          <td className="py-2.5 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => setSelectedEditorDoc(doc)}
                                className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                                title="Ver / Modificar propuesta"
                              >
                                <LuSquarePen className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedUploadDoc(doc)}
                                className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                                title="Cargar / Actualizar archivo"
                              >
                                <LuUpload className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedAuditDoc(doc)}
                                className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                                title="Auditar cumplimiento"
                              >
                                <LuClipboardCheck className="w-3.5 h-3.5 text-teal-600" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  alert(
                                    `Descargando documento oficial: ${doc.fileName || `${doc.code}.pdf`}`
                                  )
                                }
                                className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                                title="Descargar documento"
                              >
                                <LuDownload className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación de Gestión Documental */}
            {totalDocPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                <span className="text-[11px] text-gray-500 font-medium">
                  Mostrando <strong className="text-gray-800">{startDocIndex + 1}</strong> a{" "}
                  <strong className="text-gray-800">
                    {Math.min(startDocIndex + docPageSize, filteredDocs.length)}
                  </strong>{" "}
                  de <strong className="text-gray-800">{filteredDocs.length}</strong> documentos
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentDocPage === 1}
                    onClick={() => setDocPage((prev) => Math.max(1, prev - 1))}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <LuChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalDocPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setDocPage(page)}
                        className={clsx(
                          "w-6 h-6 text-xs font-bold rounded-md transition cursor-pointer flex items-center justify-center",
                          currentDocPage === page
                            ? "bg-teal-600 text-white shadow-2xs"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={currentDocPage === totalDocPages}
                    onClick={() => setDocPage((prev) => Math.min(totalDocPages, prev + 1))}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Siguiente</span>
                    <LuChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 2: AUDITORÍA Y FISCALIZACIÓN (CON PAGINACIÓN)
          ========================================================================= */}
      {mainViewMode === "auditoria" && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-200">
          {/* Banner de Alerta de Fiscalización Compacto */}
          {criticalBreachesList.length > 0 ? (
            <div className="bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent border border-red-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#F04438] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <LuShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    Se detectaron {criticalBreachesList.length} brechas normativas críticas ante fiscalización de la DT / SEREMI
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    Revisa los documentos observados para evitar sanciones o paralizaciones.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full flex-shrink-0">
                Acción Requerida
              </span>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 px-4 flex items-center gap-2 text-xs text-emerald-900">
              <LuCircleCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Auditoría al 100% Conforme:</strong> Sin brechas críticas detectadas.
              </span>
            </div>
          )}

          {/* Grilla Paginada de Tarjetas de Auditoría (3 tarjetas por fila) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {paginatedAuditDocs.map((doc) => {
              const applicableCount = doc.auditChecklist.filter(
                (p) => p.status !== "No Aplica"
              ).length;
              const passedCount = doc.auditChecklist.filter(
                (p) => p.status === "Cumple"
              ).length;

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs hover:border-teal-300 transition flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {doc.code}
                      </span>
                      <span
                        className={clsx(
                          "text-xs font-black px-2 py-0.5 rounded-md",
                          doc.auditScore >= 90
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : doc.auditScore >= 70
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        )}
                      >
                        {doc.auditScore}%
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm mt-1.5 line-clamp-1">
                      {doc.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                      ⚖️ {doc.regulatoryBasis}
                    </p>

                    {/* Barra de Progreso */}
                    <div className="mt-2.5">
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1">
                        <div
                          className={clsx(
                            "h-1.5 rounded-full transition-all duration-300",
                            doc.auditScore >= 90
                              ? "bg-emerald-500"
                              : doc.auditScore >= 70
                              ? "bg-amber-500"
                              : "bg-red-500"
                          )}
                          style={{ width: `${doc.auditScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {passedCount} de {applicableCount} criterios conformes
                      </span>
                    </div>

                    {/* Resumen de Puntos */}
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-col gap-1 text-[10px]">
                      {doc.auditChecklist.slice(0, 2).map((pt) => (
                        <div key={pt.id} className="flex items-center gap-1.5">
                          <span
                            className={clsx(
                              "w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0",
                              pt.status === "Cumple" && "bg-emerald-500 text-white",
                              pt.status === "Observado" && "bg-amber-500 text-white",
                              pt.status === "No Cumple" && "bg-red-500 text-white",
                              pt.status === "No Aplica" && "bg-gray-300 text-white"
                            )}
                          >
                            {pt.status === "Cumple"
                              ? "✓"
                              : pt.status === "Observado"
                              ? "!"
                              : "✕"}
                          </span>
                          <p className="truncate text-gray-600">{pt.requirement}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEditorDoc(doc)}
                      className="text-[10px] font-semibold text-gray-500 hover:text-teal-700 cursor-pointer"
                    >
                      Ver texto
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAuditDoc(doc)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition cursor-pointer shadow-2xs"
                    >
                      <LuClipboardCheck className="w-3.5 h-3.5" />
                      Auditar Requisitos
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación de Auditoría */}
          {totalAuditPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-xs">
              <span className="text-[11px] text-gray-500 font-medium">
                Página <strong className="text-gray-800">{currentAuditPage}</strong> de{" "}
                <strong className="text-gray-800">{totalAuditPages}</strong> ({docs.length} documentos auditables)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentAuditPage === 1}
                  onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <LuChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalAuditPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setAuditPage(page)}
                      className={clsx(
                        "w-6 h-6 text-xs font-bold rounded-md transition cursor-pointer flex items-center justify-center",
                        currentAuditPage === page
                          ? "bg-teal-600 text-white shadow-2xs"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={currentAuditPage === totalAuditPages}
                  onClick={() => setAuditPage((prev) => Math.min(totalAuditPages, prev + 1))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>Siguiente</span>
                  <LuChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALES INTERACTIVOS
          ========================================================================= */}

      {/* 1. Modal de Auditoría */}
      <DocAuditModal
        isOpen={!!selectedAuditDoc}
        doc={selectedAuditDoc}
        onClose={() => setSelectedAuditDoc(null)}
        onUpdatePoint={updateAuditPoint}
      />

      {/* 2. Modal Editor de Propuesta Base */}
      <DocEditorModal
        isOpen={!!selectedEditorDoc}
        doc={selectedEditorDoc}
        onClose={() => setSelectedEditorDoc(null)}
        onSaveSections={updateDocSections}
      />

      {/* 3. Modal de Carga de Archivo para Documento Existente */}
      <DocUploadModal
        isOpen={!!selectedUploadDoc}
        targetDoc={selectedUploadDoc}
        onClose={() => setSelectedUploadDoc(null)}
        onUploadCustomFile={uploadCustomFile}
      />

      {/* 4. Modal para Crear / Cargar Nuevo Documento Personalizado */}
      <DocUploadModal
        isOpen={isNewDocUploadOpen}
        onClose={() => setIsNewDocUploadOpen(false)}
        onUploadCustomFile={() => {}}
        onAddNewDocument={addDocument}
      />
    </div>
  );
}
