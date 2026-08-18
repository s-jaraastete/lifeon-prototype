"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  LuLayoutGrid,
  LuList,
  LuFlame,
  LuSearch,
  LuSlidersHorizontal,
  LuPlus,
  LuUpload,
  LuChevronDown,
  LuMapPin,
  LuUserRound,
  LuEllipsisVertical,
  LuEllipsis,
  LuTriangleAlert,
  LuX,
  LuCheck,
  LuDownload,
  LuFileSpreadsheet,
  LuEye,
  LuTrash2,
  LuCopy,
  LuSquarePen,
  LuSparkles,
} from "react-icons/lu";
import IperMatrixDetailView from "./IperMatrixDetailView";

export type MatrixStatus =
  | "Vigente"
  | "En revisión"
  | "Borrador"
  | "Observado"
  | "En aprobación"
  | "En modificación"
  | "No iniciado"
  | "Vencido";

export interface IperMatrixItem {
  id: string;
  code: string;
  name: string;
  workCenter: string;
  responsible: string;
  totalRecords: number | string;
  intolerableRisks: number | string;
  expiryText: string;
  isExpired?: boolean;
  status: MatrixStatus;
}

export interface SignificanceImpactItem {
  id: string;
  title: string;
  score: number;
  scoreLabel: string;
  area: string;
  aspect: string;
  evaluatedScore: string;
  prob: number;
  impact: number;
}

const INITIAL_MATRICES: IperMatrixItem[] = [
  {
    id: "1",
    code: "MA-001",
    name: "Operación de equipos pesados",
    workCenter: "Planta Quilicura",
    responsible: "Ana Silva Catrileo",
    totalRecords: 85,
    intolerableRisks: 4,
    expiryText: "Vence en 150 días",
    status: "Vigente",
  },
  {
    id: "2",
    code: "MA-002",
    name: "Mina Roja - Sector Norte",
    workCenter: "Mina Roja",
    responsible: "Carlos Mora Rocha",
    totalRecords: 142,
    intolerableRisks: 19,
    expiryText: "Vencimiento: -",
    status: "En revisión",
  },
  {
    id: "3",
    code: "MA-003",
    name: "Mantenimiento e instalaciones eléctricas",
    workCenter: "Taller central",
    responsible: "Ramiro Fuentes Rojas",
    totalRecords: 0,
    intolerableRisks: 0,
    expiryText: "Vencimiento: -",
    status: "Borrador",
  },
  {
    id: "4",
    code: "MA-004",
    name: "Bodega y manejo de sustancias",
    workCenter: "Planta Quilicura",
    responsible: "Ramiro Fuentes Rojas",
    totalRecords: 28,
    intolerableRisks: 2,
    expiryText: "Vencimiento: -",
    status: "Observado",
  },
  {
    id: "5",
    code: "MA-005",
    name: "Bodega y manejo de sustancias",
    workCenter: "Centro de distribución Lo Espejo",
    responsible: "Ramiro Fuentes Rojas",
    totalRecords: 28,
    intolerableRisks: 2,
    expiryText: "Vencimiento: -",
    status: "En aprobación",
  },
  {
    id: "6",
    code: "MA-006",
    name: "Bodega y manejo de sustancias",
    workCenter: "Centro de distribución Lo Espejo",
    responsible: "Ramiro Fuentes Rojas",
    totalRecords: 28,
    intolerableRisks: 2,
    expiryText: "Vencimiento: -",
    status: "En modificación",
  },
  {
    id: "7",
    code: "MA-007",
    name: "Bodega y manejo de sustancias",
    workCenter: "Centro de distribución Lo Espejo",
    responsible: "Ramiro Fuentes Rojas",
    totalRecords: "-",
    intolerableRisks: "-",
    expiryText: "Vencimiento: -",
    status: "No iniciado",
  },
  {
    id: "8",
    code: "MA-008",
    name: "Bodega y manejo de sustancias",
    workCenter: "Centro de distribución Lo Espejo",
    responsible: "Ramiro Fuentes Rojas",
    totalRecords: 28,
    intolerableRisks: 2,
    expiryText: "Vencido hace 5 días",
    isExpired: true,
    status: "Vencido",
  },
];

const INITIAL_IMPACTS: SignificanceImpactItem[] = [
  {
    id: "imp-1",
    title: "Contaminación de aguas superficiales",
    score: 19,
    scoreLabel: "PTO 19",
    area: "Planta",
    aspect: "Derrame potencial de aceites y lubricantes",
    evaluatedScore: "10 pts",
    prob: 2,
    impact: 5,
  },
  {
    id: "imp-2",
    title: "Contaminación del suelo",
    score: 17,
    scoreLabel: "PTO 17",
    area: "Planta",
    aspect: "Generación de residuos peligrosos",
    evaluatedScore: "12 pts",
    prob: 3,
    impact: 4,
  },
  {
    id: "imp-3",
    title: "Agotamiento de recursos naturales",
    score: 16,
    scoreLabel: "PTO 16",
    area: "Servicios Generales",
    aspect: "Consumo de agua",
    evaluatedScore: "8 pts",
    prob: 2,
    impact: 4,
  },
  {
    id: "imp-4",
    title: "Aumento de residuos a disposición final",
    score: 15,
    scoreLabel: "PTO 15",
    area: "Planta",
    aspect: "Generación de residuos no peligrosos",
    evaluatedScore: "10 pts",
    prob: 4,
    impact: 3,
  },
  {
    id: "imp-5",
    title: "Exposición a vapores orgánicos y solventes",
    score: 13,
    scoreLabel: "PTO 13",
    area: "Bodega Química",
    aspect: "Almacenamiento y trasvasije",
    evaluatedScore: "9 pts",
    prob: 5,
    impact: 2,
  },
  {
    id: "imp-6",
    title: "Emisión de material particulado MP10 / MP2.5",
    score: 8,
    scoreLabel: "PTO 8",
    area: "Mina / Cantera",
    aspect: "Tránsito de camiones tolva",
    evaluatedScore: "6 pts",
    prob: 3,
    impact: 2,
  },
];

// Matrix Heatmap Definition (5 Rows x 5 Cols)
// Row 5 (Top, Impact 5) -> Row 1 (Bottom, Impact 1)
const SIGNIFICANCE_GRID = [
  // Impact 5 (Row index 0)
  [
    { val: 18, color: "orange", count: 0, prob: 1, impact: 5 },
    { val: 19, color: "orange", count: 1, prob: 2, impact: 5 },
    { val: 23, color: "red", count: 0, prob: 3, impact: 5 },
    { val: 24, color: "red", count: 0, prob: 4, impact: 5 },
    { val: 25, color: "red", count: 0, prob: 5, impact: 5 },
  ],
  // Impact 4 (Row index 1)
  [
    { val: 12, color: "yellow", count: 0, prob: 1, impact: 4 },
    { val: 16, color: "orange", count: 1, prob: 2, impact: 4 },
    { val: 17, color: "orange", count: 1, prob: 3, impact: 4 },
    { val: 21, color: "red", count: 0, prob: 4, impact: 4 },
    { val: 22, color: "red", count: 0, prob: 5, impact: 4 },
  ],
  // Impact 3 (Row index 2)
  [
    { val: 10, color: "yellow", count: 0, prob: 1, impact: 3 },
    { val: 11, color: "yellow", count: 0, prob: 2, impact: 3 },
    { val: 14, color: "orange", count: 0, prob: 3, impact: 3 },
    { val: 15, color: "orange", count: 2, prob: 4, impact: 3 },
    { val: 20, color: "red", count: 0, prob: 5, impact: 3 },
  ],
  // Impact 2 (Row index 3)
  [
    { val: 4, color: "green", count: 0, prob: 1, impact: 2 },
    { val: 5, color: "green", count: 0, prob: 2, impact: 2 },
    { val: 8, color: "yellow", count: 2, prob: 3, impact: 2 },
    { val: 9, color: "yellow", count: 1, prob: 4, impact: 2 },
    { val: 13, color: "orange", count: 2, prob: 5, impact: 2 },
  ],
  // Impact 1 (Row index 4)
  [
    { val: 1, color: "green", count: 0, prob: 1, impact: 1 },
    { val: 2, color: "green", count: 0, prob: 2, impact: 1 },
    { val: 3, color: "green", count: 0, prob: 3, impact: 1 },
    { val: 6, color: "yellow", count: 0, prob: 4, impact: 1 },
    { val: 7, color: "yellow", count: 1, prob: 5, impact: 1 },
  ],
];

export default function IperMatrixView({ onOpenAprVirtual }: { onOpenAprVirtual?: () => void }) {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "significance">("grid");
  const [matrices, setMatrices] = useState<IperMatrixItem[]>(INITIAL_MATRICES);
  const [impacts, setImpacts] = useState<SignificanceImpactItem[]>(INITIAL_IMPACTS);
  const [selectedMatrix, setSelectedMatrix] = useState<IperMatrixItem | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selectedCell, setSelectedCell] = useState<{ prob: number; impact: number; val: number } | null>(null);

  // Modals
  const [isNewMatrixOpen, setIsNewMatrixOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // New Matrix Form State
  const [newCode, setNewCode] = useState(`MA-00${matrices.length + 1}`);
  const [newName, setNewName] = useState("");
  const [newWorkCenter, setNewWorkCenter] = useState("Planta Quilicura");
  const [newResponsible, setNewResponsible] = useState("Sergio A. Jara Astete");

  const getStatusBadgeStyle = (status: MatrixStatus) => {
    switch (status) {
      case "Vigente":
        return "bg-[#ECFDF5] text-[#10B981] border-emerald-200";
      case "En revisión":
        return "bg-[#EFF6FF] text-[#3B82F6] border-blue-200";
      case "Borrador":
        return "bg-[#F3F4F6] text-[#4B5563] border-gray-200";
      case "Observado":
        return "bg-[#FEF3C7] text-[#D97706] border-amber-200";
      case "En aprobación":
        return "bg-[#FAF5FF] text-[#A855F7] border-purple-200";
      case "En modificación":
        return "bg-[#E0F2FE] text-[#0284C7] border-sky-200";
      case "No iniciado":
        return "bg-[#F3F4F6] text-[#6B7280] border-gray-200";
      case "Vencido":
        return "bg-[#FEE2E2] text-[#EF4444] border-red-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleCreateMatrix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: IperMatrixItem = {
      id: `m-${Date.now()}`,
      code: newCode || `MA-00${matrices.length + 1}`,
      name: newName,
      workCenter: newWorkCenter,
      responsible: newResponsible,
      totalRecords: 0,
      intolerableRisks: 0,
      expiryText: "Vencimiento: -",
      status: "No iniciado",
    };

    setMatrices([newItem, ...matrices]);
    setIsNewMatrixOpen(false);
    setNewName("");
  };

  const filteredMatrices = matrices.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.workCenter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.responsible.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "Todos" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredImpacts = impacts.filter((imp) => {
    if (!selectedCell) return true;
    return imp.prob === selectedCell.prob && imp.impact === selectedCell.impact;
  });

  // Si hay una matriz seleccionada, mostrar la vista detallada de inspección y edición
  if (selectedMatrix) {
    return (
      <IperMatrixDetailView
        matrix={selectedMatrix}
        onBack={() => setSelectedMatrix(null)}
        onUpdateMatrix={(updated) => {
          setMatrices(matrices.map((m) => (m.id === updated.id ? updated : m)));
          setSelectedMatrix(updated);
        }}
        onOpenAprVirtual={onOpenAprVirtual}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 font-[family-name:var(--font-poppins)] animate-in fade-in duration-300">
      {/* 1. Encabezado MIPER */}
      <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shadow-xs flex-shrink-0">
            <LuLayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Matriz IPER</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Administra los inventarios de riesgos y evaluaciones por centro de trabajo o proyecto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#F04438] bg-white border border-[#F04438] hover:bg-red-50 transition cursor-pointer"
          >
            <LuUpload className="w-4 h-4" />
            Importar desde XLSX
          </button>

          <button
            type="button"
            onClick={() => setIsNewMatrixOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#F04438] hover:bg-[#D92D20] shadow-xs transition cursor-pointer"
          >
            <LuPlus className="w-4 h-4" />
            Nueva Matriz
          </button>
        </div>
      </div>

      {/* 2. 4 Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">Matrices vigentes</p>
          <p className="text-3xl font-bold text-gray-900 my-0.5">1</p>
          <p className="text-[11px] text-gray-400">de 8 totales</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">Lorem Ipsum</p>
          <p className="text-3xl font-bold text-gray-900 my-0.5">0</p>
          <p className="text-[11px] font-medium text-[#10B981]">+7,7% vs mes anterior</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">Lorem Ipsum</p>
          <p className="text-3xl font-bold text-gray-900 my-0.5">0</p>
          <p className="text-[11px] font-medium text-[#EAB308]">+7,7% vs mes anterior</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">Lorem Ipsum</p>
          <p className="text-3xl font-bold text-gray-900 my-0.5">0</p>
          <p className="text-[11px] font-medium text-[#EF4444]">+7,7% vs mes anterior</p>
        </div>
      </div>

      {/* 3. Barra de Control, Buscador y Conmutador de Vistas */}
      <div className="bg-white rounded-2xl p-3 px-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative w-full md:max-w-md">
          <LuSearch className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, área, responsable, código..."
            className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-gray-800 placeholder-gray-400 transition"
          />
        </div>

        {/* Controles del Lado Derecho */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Selector de Estado */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
            >
              <option value="Todos">Estado: Todos</option>
              <option value="Vigente">Vigente</option>
              <option value="En revisión">En revisión</option>
              <option value="Borrador">Borrador</option>
              <option value="Observado">Observado</option>
              <option value="En aprobación">En aprobación</option>
              <option value="En modificación">En modificación</option>
              <option value="No iniciado">No iniciado</option>
              <option value="Vencido">Vencido</option>
            </select>
            <LuChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Grupo de Conmutador de 3 Vistas */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 gap-1">
            {/* Vista 1: Cuadrícula */}
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Vista en Cuadrícula"
              className={clsx(
                "p-1.5 rounded-lg transition cursor-pointer",
                viewMode === "grid"
                  ? "bg-white text-gray-900 shadow-2xs font-bold"
                  : "text-gray-400 hover:text-gray-700"
              )}
            >
              <LuLayoutGrid className="w-4 h-4" />
            </button>

            {/* Vista 2: Lista */}
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Vista en Lista"
              className={clsx(
                "p-1.5 rounded-lg transition cursor-pointer",
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-2xs font-bold"
                  : "text-gray-400 hover:text-gray-700"
              )}
            >
              <LuList className="w-4 h-4" />
            </button>

            {/* Vista 3: Matriz de Significancia */}
            <button
              type="button"
              onClick={() => setViewMode("significance")}
              title="Vista Matriz de Significancia"
              className={clsx(
                "p-1.5 rounded-lg transition cursor-pointer",
                viewMode === "significance"
                  ? "bg-white text-[#F04438] shadow-2xs font-bold"
                  : "text-gray-400 hover:text-gray-700"
              )}
            >
              <LuFlame className="w-4 h-4" />
            </button>
          </div>

          {/* Botón Filtros */}
          <button
            type="button"
            onClick={() => alert("Filtros avanzados disponibles:\n- Por Centro de Trabajo\n- Por Responsable\n- Por Rango de Fechas\n- Por Nivel de Riesgo")}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            <LuSlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
            <span>Filtros</span>
            <LuChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          VISTA 1: CUADRÍCULA (GRID VIEW)
          ========================================================================= */}
      {viewMode === "grid" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredMatrices.map((mat) => (
              <div
                key={mat.id}
                onClick={() => setSelectedMatrix(mat)}
                className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between gap-3 hover:shadow-md hover:border-teal-300 transition relative group cursor-pointer"
              >
                {/* Cabecera de la Tarjeta */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-400">{mat.code}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={clsx(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                          getStatusBadgeStyle(mat.status)
                        )}
                      >
                        {mat.status}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === mat.id ? null : mat.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                      >
                        <LuEllipsisVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown de opciones */}
                      {activeMenuId === mat.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-3 top-10 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20 text-xs text-gray-700 animate-in fade-in"
                        >
                          <button
                            onClick={() => {
                              setSelectedMatrix(mat);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-teal-50 text-teal-700 font-semibold flex items-center gap-2"
                          >
                            <LuSparkles className="w-3.5 h-3.5 text-teal-600" /> Iniciar edición
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMatrix(mat);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2"
                          >
                            <LuEye className="w-3.5 h-3.5 text-gray-500" /> Ver detalle
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMatrix(mat);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2"
                          >
                            <LuSquarePen className="w-3.5 h-3.5 text-gray-500" /> Editar matriz
                          </button>
                          <button
                            onClick={() => {
                              const duplicated: IperMatrixItem = {
                                ...mat,
                                id: `m-${Date.now()}`,
                                code: `MA-00${matrices.length + 1}`,
                                name: `${mat.name} (Copia)`,
                              };
                              setMatrices([...matrices, duplicated]);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2"
                          >
                            <LuCopy className="w-3.5 h-3.5 text-gray-500" /> Duplicar
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => {
                              setMatrices(matrices.filter((item) => item.id !== mat.id));
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <LuTrash2 className="w-3.5 h-3.5" /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[36px]">
                    {mat.name}
                  </h3>

                  <div className="flex flex-col gap-1 mt-2.5 text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <LuMapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{mat.workCenter}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <LuUserRound className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{mat.responsible}</span>
                    </div>
                  </div>
                </div>

                {/* Caja Interna de Métricas */}
                <div>
                  <div className="bg-[#F8FAFC] rounded-xl p-2.5 grid grid-cols-2 gap-2 border border-gray-100 text-center mb-2">
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Registros</p>
                      <p className="text-base font-bold text-gray-900 mt-0.5">{mat.totalRecords}</p>
                    </div>
                    <div className="border-l border-gray-200/70">
                      <p className="text-[10px] text-gray-400 font-medium">Intolerables</p>
                      <p className="text-base font-bold text-gray-900 mt-0.5">{mat.intolerableRisks}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={clsx(
                        "text-[10px] font-medium",
                        mat.isExpired ? "text-[#EF4444] font-bold" : "text-gray-400"
                      )}
                    >
                      {mat.expiryText}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Mostrando <span className="font-semibold text-gray-700">{filteredMatrices.length}</span> de{" "}
            <span className="font-semibold text-gray-700">{matrices.length}</span> registros
          </p>
        </div>
      )}

      {/* =========================================================================
          VISTA 2: LISTA / TABLA (LIST VIEW)
          ========================================================================= */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-600 font-semibold bg-white">
                    <th className="py-3.5 px-4">Código</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Nombre Matriz</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Centro de trabajo</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Responsable</th>
                    <th className="py-3.5 px-4 text-center">Registros</th>
                    <th className="py-3.5 px-4 text-center">Riesgos intolerables</th>
                    <th className="py-3.5 px-4">Vence</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMatrices.map((mat) => (
                    <tr
                      key={mat.id}
                      onClick={() => setSelectedMatrix(mat)}
                      className="hover:bg-teal-50/40 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-semibold text-gray-700">{mat.code}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 group-hover:text-teal-700 transition">
                        {mat.name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{mat.workCenter}</td>
                      <td className="py-3.5 px-4 text-gray-600">{mat.responsible}</td>
                      <td className="py-3.5 px-4 text-center font-medium text-gray-800">
                        {mat.totalRecords}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-gray-800">
                        {mat.intolerableRisks}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={clsx(
                            "text-xs",
                            mat.isExpired ? "text-[#EF4444] font-bold" : "text-gray-500"
                          )}
                        >
                          {mat.expiryText}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={clsx(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block",
                            getStatusBadgeStyle(mat.status)
                          )}
                        >
                          {mat.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMatrix(mat);
                          }}
                          className="text-gray-400 hover:text-teal-700 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        >
                          <LuEllipsis className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Mostrando <span className="font-semibold text-gray-700">{filteredMatrices.length}</span> de{" "}
            <span className="font-semibold text-gray-700">{matrices.length}</span> registros
          </p>
        </div>
      )}

      {/* =========================================================================
          VISTA 3: MATRIZ DE SIGNIFICANCIA (FRECUENCIA VS SEVERIDAD)
          ========================================================================= */}
      {viewMode === "significance" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Columna Izquierda: Grilla 5x5 de Significancia (8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
              {/* Encabezado */}
              <div className="flex items-center gap-2 mb-6">
                <LuTriangleAlert className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  Matriz de Significancia (Frecuencia vs Severidad)
                </h3>
              </div>

              {/* Contenedor con Ejes X e Y y Matriz 5x5 */}
              <div className="flex items-center justify-center my-2">
                <div className="flex items-center gap-3">
                  {/* Eje Y: IMPACTO */}
                  <div className="flex flex-col items-center justify-between h-[280px]">
                    <div className="h-full bg-slate-100/90 rounded-full px-2 py-3 flex items-center justify-center border border-slate-200/60 shadow-2xs">
                      <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        IMPACTO
                      </span>
                    </div>
                  </div>

                  {/* Números del Eje Y (5 a 1) */}
                  <div className="flex flex-col justify-between h-[280px] py-3 text-xs font-semibold text-gray-400">
                    <span>5</span>
                    <span>4</span>
                    <span>3</span>
                    <span>2</span>
                    <span>1</span>
                  </div>

                  {/* Grilla 5x5 y Eje X */}
                  <div className="flex flex-col gap-2">
                    {/* Grilla de Celdas 5x5 */}
                    <div className="grid grid-rows-5 gap-1.5 w-[280px] sm:w-[320px] md:w-[360px] h-[280px]">
                      {SIGNIFICANCE_GRID.map((row, rIdx) => (
                        <div key={rIdx} className="grid grid-cols-5 gap-1.5">
                          {row.map((cell, cIdx) => {
                            const isSelected =
                              selectedCell?.prob === cell.prob &&
                              selectedCell?.impact === cell.impact;

                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() =>
                                  setSelectedCell(
                                    isSelected
                                      ? null
                                      : { prob: cell.prob, impact: cell.impact, val: cell.val }
                                  )
                                }
                                className={clsx(
                                  "rounded-lg flex items-center justify-center relative font-semibold text-xs transition cursor-pointer shadow-2xs",
                                  cell.color === "green" && "bg-[#4ADE80] hover:bg-[#22C55E] text-white",
                                  cell.color === "yellow" && "bg-[#FACC15] hover:bg-[#EAB308] text-white",
                                  cell.color === "orange" && "bg-[#FB923C] hover:bg-[#F97316] text-white",
                                  cell.color === "red" && "bg-[#EF4444] hover:bg-[#DC2626] text-white",
                                  isSelected && "ring-4 ring-slate-900/30 scale-105 z-10 font-black"
                                )}
                              >
                                <span>{cell.val}</span>

                                {/* Badge circular con cantidad de registros si count > 0 */}
                                {cell.count > 0 && (
                                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white text-gray-800 font-bold text-[11px] flex items-center justify-center shadow-md border border-gray-100">
                                    {cell.count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Números del Eje X (1 a 5) */}
                    <div className="grid grid-cols-5 text-center text-xs font-semibold text-gray-400 pt-1">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>

                    {/* Eje X: PROBABILIDAD (RESIDUAL) */}
                    <div className="bg-slate-100/90 rounded-full py-1 text-center border border-slate-200/60 shadow-2xs mt-1">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        PROBABILIDAD (RESIDUAL)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leyenda Inferior */}
              <div className="flex items-center justify-center gap-5 mt-6 pt-4 border-t border-gray-100 text-xs font-medium text-gray-600 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80]" />
                  <span>Bajo (1-5)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                  <span>Medio (6-12)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FB923C]" />
                  <span>Alto (13-19)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span>Crítico (20-25)</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Impactos Registrados (4 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Impactos Registrados ({filteredImpacts.length})
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Haz clic en una celda de la matriz para filtrar
                    </p>
                  </div>
                  {selectedCell && (
                    <button
                      type="button"
                      onClick={() => setSelectedCell(null)}
                      className="text-[10px] font-semibold text-teal-600 hover:underline cursor-pointer"
                    >
                      Limpiar filtro
                    </button>
                  )}
                </div>

                {/* Lista de Tarjetas de Impacto */}
                <div className="flex flex-col gap-2.5 mt-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredImpacts.length === 0 ? (
                    <p className="text-xs text-gray-400 py-10 text-center">
                      No hay impactos registrados en esta celda evaluada.
                    </p>
                  ) : (
                    filteredImpacts.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3.5 hover:border-teal-200 transition"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h5 className="text-xs font-bold text-gray-900 leading-snug">
                            {item.title}
                          </h5>
                          <span className="bg-[#FB923C] text-white text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-2xs">
                            {item.scoreLabel}
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-500 flex flex-col gap-0.5 mt-1">
                          <p>
                            <span className="text-gray-400">Área:</span> {item.area}
                          </p>
                          <p className="line-clamp-1">
                            <span className="text-gray-400">Aspecto:</span> {item.aspect}
                          </p>
                          <p className="text-gray-400 text-[10px] mt-1">
                            Puntaje Total Evaluado: {item.evaluatedScore}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Mostrando <span className="font-semibold text-gray-700">{filteredImpacts.length}</span> de{" "}
            <span className="font-semibold text-gray-700">{impacts.length}</span> registros
          </p>
        </div>
      )}

      {/* =========================================================================
          MODAL: + NUEVA MATRIZ IPER
          ========================================================================= */}
      {isNewMatrixOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setIsNewMatrixOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Nueva Matriz IPER</h3>
            <p className="text-xs text-gray-500 mb-4">
              Crea un nuevo inventario de peligros y evaluación de riesgos para un centro de trabajo.
            </p>

            <form onSubmit={handleCreateMatrix} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Código</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Nombre de la Matriz / Proceso
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Montaje Estructural y Trabajos en Altura"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Centro de Trabajo
                  </label>
                  <input
                    type="text"
                    value={newWorkCenter}
                    onChange={(e) => setNewWorkCenter(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Responsable
                  </label>
                  <input
                    type="text"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewMatrixOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#F04438] hover:bg-[#D92D20] rounded-xl transition cursor-pointer shadow-xs"
                >
                  Crear Matriz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: IMPORTAR DESDE XLSX
          ========================================================================= */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setIsImportOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Importar Matriz desde Excel</h3>
            <p className="text-xs text-gray-500 mb-4">
              Sube un archivo .xlsx o .csv con la estructura de tareas, peligros y controles DS 44.
            </p>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50 flex flex-col items-center justify-center">
              <LuFileSpreadsheet className="w-10 h-10 text-emerald-600 mb-2" />
              <p className="text-xs font-semibold text-gray-800">Arrastra tu planilla Excel aquí</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Formatos compatibles: .xlsx, .xls, .csv</p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Matriz importada con éxito desde archivo XLSX.");
                  setIsImportOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#F04438] hover:bg-[#D92D20] rounded-xl transition cursor-pointer shadow-xs"
              >
                Procesar Archivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
