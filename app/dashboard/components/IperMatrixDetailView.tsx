"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  LuArrowLeft,
  LuPlus,
  LuFileSpreadsheet,
  LuDownload,
  LuSparkles,
  LuSearch,
  LuFilter,
  LuPencil,
  LuTrash2,
  LuCircleCheck,
  LuTriangleAlert,
  LuShieldAlert,
  LuMapPin,
  LuUserRound,
  LuCalendar,
  LuX,
  LuSave,
  LuEye,
  LuAtom,
  LuSlidersHorizontal,
  LuFileText,
  LuLock,
} from "react-icons/lu";
import { IperMatrixItem, MatrixStatus, getStatusBadgeStyle } from "./IperMatrixView";
import IperMatrixWizard from "./IperMatrixWizard";
import IrlDocumentModal from "./IrlDocumentModal";

export interface IperEvaluationRow {
  id: string;
  process: string;
  task: string;
  hazard: string;
  riskEvent: string;
  probInitial: number;
  sevInitial: number;
  riskInitial: number;
  initialLevel: "Crítico" | "Alto" | "Medio" | "Bajo";
  controls: string;
  probResidual: number;
  sevResidual: number;
  riskResidual: number;
  residualLevel: "Crítico" | "Alto" | "Medio" | "Bajo";
  controlStatus: "Implementado" | "En proceso" | "Pendiente";
  responsible: string;
}

const DEFAULT_EVALUATIONS: Record<string, IperEvaluationRow[]> = {
  "MA-001": [
    {
      id: "EV-01",
      process: "Operaciones de Movimiento de Tierras",
      task: "Operación de retroexcavadora y excavadora oruga en taludes > 35°",
      hazard: "Pérdida de sustentación y volcamiento de maquinaria pesada",
      riskEvent: "Aplastamiento / Politraumatismo grave o fatal del operador",
      probInitial: 4,
      sevInitial: 5,
      riskInitial: 20,
      initialLevel: "Crítico",
      controls: "Cabina ROPS/FOPS certificada, sensor de inclinación con alarma sonora, uso permanente de cinturón de 3 puntas, bermas de seguridad de 1.2m, check list diario de orugas.",
      probResidual: 1,
      sevResidual: 3,
      riskResidual: 3,
      residualLevel: "Bajo",
      controlStatus: "Implementado",
      responsible: "Ana Silva Catrileo",
    },
    {
      id: "EV-02",
      process: "Carguío y Transporte de Áridos",
      task: "Carguío de camión tolva y maniobras de aculatamiento en retroceso",
      hazard: "Ángulo ciego del conductor y presencia de trabajadores a pie",
      riskEvent: "Atropello / Aplastamiento por vehículo pesado en retroceso",
      probInitial: 4,
      sevInitial: 5,
      riskInitial: 20,
      initialLevel: "Crítico",
      controls: "Alarma de retroceso sonora + baliza estroboscópica, cámara de reversa en cabina, segregación física estricta entre peatones y camiones, chaleco reflectante alta visibilidad.",
      probResidual: 1,
      sevResidual: 3,
      riskResidual: 3,
      residualLevel: "Bajo",
      controlStatus: "Implementado",
      responsible: "Ana Silva Catrileo",
    },
    {
      id: "EV-03",
      process: "Mantenimiento y Despeje de Vías",
      task: "Nivelación de terreno con motoniveladora cerca de zanjas activas",
      hazard: "Derrumbe del borde de zanja por sobrecarga de la maquinaria",
      riskEvent: "Caída de la maquinaria al interior de la excavación / Volcamiento",
      probInitial: 3,
      sevInitial: 4,
      riskInitial: 12,
      initialLevel: "Alto",
      controls: "Distancia mínima de seguridad de 1.5m respecto al borde de excavación, señalización perimetral con pretiles y apoyo de señalero (loro rigger).",
      probResidual: 1,
      sevResidual: 2,
      riskResidual: 2,
      residualLevel: "Bajo",
      controlStatus: "Implementado",
      responsible: "Ana Silva Catrileo",
    },
    {
      id: "EV-04",
      process: "Abastecimiento de Combustible",
      task: "Carga de petróleo diésel a maquinaria pesada en terreno",
      hazard: "Derrame de hidrocarburos / Contacto con fuentes de ignición",
      riskEvent: "Amago de incendio / Quemaduras / Contaminación del suelo",
      probInitial: 3,
      sevInitial: 3,
      riskInitial: 9,
      initialLevel: "Medio",
      controls: "Bandeja de contención antiderrame, conexión a tierra para descarga estática, extintor de 10kg PQS al alcance, kit para control de derrames.",
      probResidual: 1,
      sevResidual: 2,
      riskResidual: 2,
      residualLevel: "Bajo",
      controlStatus: "En proceso",
      responsible: "Ana Silva Catrileo",
    },
  ],
};

interface IperMatrixDetailViewProps {
  matrix: IperMatrixItem;
  onBack: () => void;
  onUpdateMatrix: (updated: IperMatrixItem) => void;
  onOpenAprVirtual?: () => void;
  initialOpenWizard?: boolean;
}

export default function IperMatrixDetailView({
  matrix,
  onBack,
  onUpdateMatrix,
  onOpenAprVirtual,
  initialOpenWizard,
}: IperMatrixDetailViewProps) {
  const [evaluations, setEvaluations] = useState<IperEvaluationRow[]>(
    matrix.status === "No iniciado" ? [] : DEFAULT_EVALUATIONS[matrix.code] || []
  );
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("Todos");

  // Modals State
  const [isWizardOpen, setIsWizardOpen] = useState(initialOpenWizard || false);
  const [isIrlModalOpen, setIsIrlModalOpen] = useState(false);
  const [isAddEvaluationOpen, setIsAddEvaluationOpen] = useState(false);
  const [isEditGeneralOpen, setIsEditGeneralOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<IperEvaluationRow | null>(null);

  const isMatrixVigente = matrix.status === "Vigente";

  // Form State for New/Edit Hazard Evaluation
  const [formProcess, setFormProcess] = useState(matrix.name);
  const [formTask, setFormTask] = useState("");
  const [formHazard, setFormHazard] = useState("");
  const [formRiskEvent, setFormRiskEvent] = useState("");
  const [formProb, setFormProb] = useState(3);
  const [formSev, setFormSev] = useState(4);
  const [formControls, setFormControls] = useState("");
  const [formProbRes, setFormProbRes] = useState(1);
  const [formSevRes, setFormSevRes] = useState(2);
  const [formControlStatus, setFormControlStatus] = useState<"Implementado" | "En proceso" | "Pendiente">("Implementado");

  // General Edit Form State
  const [generalName, setGeneralName] = useState(matrix.name);
  const [generalWorkCenter, setGeneralWorkCenter] = useState(matrix.workCenter);
  const [generalResponsible, setGeneralResponsible] = useState(matrix.responsible);
  const [generalStatus, setGeneralStatus] = useState<MatrixStatus>(matrix.status);

  const calculateLevel = (score: number): "Crítico" | "Alto" | "Medio" | "Bajo" => {
    if (score >= 16) return "Crítico";
    if (score >= 10) return "Alto";
    if (score >= 5) return "Medio";
    return "Bajo";
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTask || !formHazard || !formControls) return;

    const initialScore = formProb * formSev;
    const residualScore = formProbRes * formSevRes;

    if (editingRow) {
      // Edit existing
      const updated = evaluations.map((row) =>
        row.id === editingRow.id
          ? {
              ...row,
              process: formProcess,
              task: formTask,
              hazard: formHazard,
              riskEvent: formRiskEvent,
              probInitial: formProb,
              sevInitial: formSev,
              riskInitial: initialScore,
              initialLevel: calculateLevel(initialScore),
              controls: formControls,
              probResidual: formProbRes,
              sevResidual: formSevRes,
              riskResidual: residualScore,
              residualLevel: calculateLevel(residualScore),
              controlStatus: formControlStatus,
            }
          : row
      );
      setEvaluations(updated);
      setEditingRow(null);
    } else {
      // Add new
      const newRow: IperEvaluationRow = {
        id: `EV-0${evaluations.length + 1}`,
        process: formProcess,
        task: formTask,
        hazard: formHazard,
        riskEvent: formRiskEvent,
        probInitial: formProb,
        sevInitial: formSev,
        riskInitial: initialScore,
        initialLevel: calculateLevel(initialScore),
        controls: formControls,
        probResidual: formProbRes,
        sevResidual: formSevRes,
        riskResidual: residualScore,
        residualLevel: calculateLevel(residualScore),
        controlStatus: formControlStatus,
        responsible: matrix.responsible,
      };
      setEvaluations([...evaluations, newRow]);
    }

    setIsAddEvaluationOpen(false);
    resetEvaluationForm();
  };

  const resetEvaluationForm = () => {
    setFormProcess(matrix.name);
    setFormTask("");
    setFormHazard("");
    setFormRiskEvent("");
    setFormProb(3);
    setFormSev(4);
    setFormControls("");
    setFormProbRes(1);
    setFormSevRes(2);
    setFormControlStatus("Implementado");
  };

  const openEditEvaluation = (row: IperEvaluationRow) => {
    setEditingRow(row);
    setFormProcess(row.process);
    setFormTask(row.task);
    setFormHazard(row.hazard);
    setFormRiskEvent(row.riskEvent);
    setFormProb(row.probInitial);
    setFormSev(row.sevInitial);
    setFormControls(row.controls);
    setFormProbRes(row.probResidual);
    setFormSevRes(row.sevResidual);
    setFormControlStatus(row.controlStatus);
    setIsAddEvaluationOpen(true);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: IperMatrixItem = {
      ...matrix,
      name: generalName,
      workCenter: generalWorkCenter,
      responsible: generalResponsible,
      status: generalStatus,
    };
    onUpdateMatrix(updated);
    setIsEditGeneralOpen(false);
  };

  const handleExportCSV = () => {
    const headers = "ID,Proceso,Tarea,Peligro,Evento de Riesgo,Prob Inicial,Sev Inicial,Riesgo Inicial,Nivel Inicial,Medidas de Control,Prob Residual,Sev Residual,Riesgo Residual,Nivel Residual,Estado del Control,Responsable\n";
    const body = evaluations
      .map(
        (r) =>
          `"${r.id}","${r.process}","${r.task}","${r.hazard}","${r.riskEvent}",${r.probInitial},${r.sevInitial},${r.riskInitial},"${r.initialLevel}","${r.controls.replace(/"/g, '""')}",${r.probResidual},${r.sevResidual},${r.riskResidual},"${r.residualLevel}","${r.controlStatus}","${r.responsible}"`
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + headers + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Matriz_${matrix.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEvaluations = evaluations.filter((row) => {
    const matchesSearch =
      row.task.toLowerCase().includes(search.toLowerCase()) ||
      row.hazard.toLowerCase().includes(search.toLowerCase()) ||
      row.controls.toLowerCase().includes(search.toLowerCase()) ||
      row.process.toLowerCase().includes(search.toLowerCase());

    const matchesLevel =
      levelFilter === "Todos" || row.initialLevel === levelFilter || row.residualLevel === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const criticalCount = evaluations.filter((e) => e.initialLevel === "Crítico").length;
  const highCount = evaluations.filter((e) => e.initialLevel === "Alto").length;
  const mediumCount = evaluations.filter((e) => e.initialLevel === "Medio").length;
  const lowCount = evaluations.filter((e) => e.initialLevel === "Bajo").length;

  if (isWizardOpen) {
    return (
      <IperMatrixWizard
        matrix={matrix}
        onClose={() => setIsWizardOpen(false)}
        onFinish={(newEvaluations, updatedMatrix) => {
          const toAdd = Array.isArray(newEvaluations) ? newEvaluations : [newEvaluations];
          setEvaluations([...toAdd, ...evaluations]);
          onUpdateMatrix(updatedMatrix);
          setIsWizardOpen(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 font-[family-name:var(--font-poppins)] animate-in fade-in duration-200">
      {/* Botón de Retorno y Barra Superior */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs hover:bg-gray-50"
        >
          <LuArrowLeft className="w-4 h-4" />
          Volver a Matrices
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Información de Riesgos Laborales (IRL) */}
          <button
            type="button"
            onClick={() => {
              if (isMatrixVigente) {
                setIsIrlModalOpen(true);
              }
            }}
            disabled={!isMatrixVigente}
            title={
              isMatrixVigente
                ? "Información de Riesgos Laborales (IRL)"
                : "El documento IRL solo está disponible para matrices en estado Vigente"
            }
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs",
              isMatrixVigente
                ? "bg-white text-teal-900 hover:bg-teal-50 border border-teal-300 ring-2 ring-teal-500/10 cursor-pointer"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
            )}
          >
            <LuFileText className={clsx("w-4 h-4", isMatrixVigente ? "text-teal-600" : "text-gray-400")} />
            <span>Información de Riesgos Laborales (IRL)</span>
            {!isMatrixVigente && <LuLock className="w-3 h-3 text-gray-400" />}
          </button>

          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition cursor-pointer shadow-xs"
          >
            <LuSparkles className="w-4 h-4" />
            Confeccionar matriz (5 etapas)
          </button>

          {onOpenAprVirtual && (
            <button
              type="button"
              onClick={onOpenAprVirtual}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition cursor-pointer"
            >
              <LuSparkles className="w-4 h-4 text-teal-600" />
              Generar APR con IA
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
          >
            <LuFileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exportar XLSX / CSV
          </button>
        </div>
      </div>

      {/* Tarjeta de Encabezado y Metadatos de la Matriz */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-start gap-3.5">
            <span className="bg-teal-50 text-teal-800 font-mono font-bold text-sm px-3 py-1.5 rounded-xl border border-teal-200 self-start">
              {matrix.code}
            </span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{matrix.name}</h2>
                <span
                  className={clsx(
                    "px-3 py-0.5 rounded-full text-xs font-bold border",
                    getStatusBadgeStyle(matrix.status)
                  )}
                >
                  {matrix.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Inventario de peligros y evaluación de riesgos bajo el marco legal chileno Decreto Supremo N° 44.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditGeneralOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition cursor-pointer self-start md:self-auto"
          >
            <LuPencil className="w-3.5 h-3.5" />
            Editar Datos Matriz
          </button>
        </div>

        {/* Metadatos Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <LuMapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400">Centro de Trabajo</p>
              <p className="font-semibold text-gray-800">{matrix.workCenter}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LuUserRound className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400">Responsable de Elaboración</p>
              <p className="font-semibold text-gray-800">{matrix.responsible}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LuCalendar className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400">Vigencia / Vencimiento</p>
              <p className={clsx("font-semibold", matrix.isExpired ? "text-red-600" : "text-gray-800")}>
                {matrix.expiryText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LuShieldAlert className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400">Total Evaluaciones</p>
              <p className="font-semibold text-gray-800">{evaluations.length} Registros activos</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 BANNER DESTACADO: INFORMACIÓN DE RIESGOS LABORALES (IRL) */}
      <div className="bg-gradient-to-r from-teal-50/90 via-white to-emerald-50/50 rounded-2xl p-5 border border-teal-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
            <LuFileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Información de Riesgos Laborales (IRL)
              </h3>
              <span
                className={clsx(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                  isMatrixVigente
                    ? "bg-teal-100 text-teal-800 border-teal-300"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                )}
              >
                {isMatrixVigente ? "Habilitado / Vigente" : "Bloqueado (Requiere estado Vigente)"}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 max-w-3xl leading-relaxed">
              En cumplimiento del Artículo 21 del D.S. N° 40 y D.S. N° 44. Se alimenta directamente de los datos de esta matriz para informar los peligros, consecuencias, medidas de control y gestionar el registro de firmas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              if (isMatrixVigente) {
                setIsIrlModalOpen(true);
              }
            }}
            disabled={!isMatrixVigente}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs",
              isMatrixVigente
                ? "bg-teal-600 text-white hover:bg-teal-700 cursor-pointer shadow-teal-500/20"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
            )}
          >
            <LuFileText className="w-4 h-4" />
            <span>{isMatrixVigente ? "Ver Información de Riesgos Laborales (IRL)" : "IRL Bloqueado"}</span>
            {!isMatrixVigente && <LuLock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Mini KPIs de la Matriz Específica */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs text-center">
          <p className="text-[11px] font-semibold text-red-600">Riesgos Críticos (Inicial)</p>
          <p className="text-2xl font-black text-red-600 mt-0.5">{criticalCount}</p>
          <span className="text-[10px] text-gray-400">Requieren control duro</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs text-center">
          <p className="text-[11px] font-semibold text-amber-600">Riesgos Altos</p>
          <p className="text-2xl font-black text-amber-600 mt-0.5">{highCount}</p>
          <span className="text-[10px] text-gray-400">En seguimiento</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs text-center">
          <p className="text-[11px] font-semibold text-yellow-600">Riesgos Medios</p>
          <p className="text-2xl font-black text-yellow-600 mt-0.5">{mediumCount}</p>
          <span className="text-[10px] text-gray-400">Monitoreo rutinario</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs text-center">
          <p className="text-[11px] font-semibold text-emerald-600">Riesgos Residuales Bajos</p>
          <p className="text-2xl font-black text-emerald-600 mt-0.5">
            {evaluations.filter((e) => e.residualLevel === "Bajo").length}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">100% bajo control</span>
        </div>
      </div>

      {/* Barra de Filtros en la Tabla */}
      <div className="bg-white rounded-2xl p-3 px-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <LuSearch className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por tarea, peligro o medida de control..."
            className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-gray-800 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-gray-400 mr-1 flex items-center gap-1">
            <LuFilter className="w-3.5 h-3.5" /> Nivel:
          </span>
          {["Todos", "Crítico", "Alto", "Medio", "Bajo"].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex-shrink-0",
                levelFilter === lvl
                  ? "bg-teal-600 text-white shadow-xs font-semibold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Completa de Identificación de Peligros y Evaluación DS 44 */}
      <div className="bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700 font-bold">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 min-w-[180px]">Proceso & Tarea</th>
                <th className="py-3.5 px-4 min-w-[180px]">Peligro & Consecuencia</th>
                <th className="py-3.5 px-4 text-center">Riesgo Inicial</th>
                <th className="py-3.5 px-4 min-w-[240px]">Jerarquía de Controles (DS 44)</th>
                <th className="py-3.5 px-4 text-center">Riesgo Residual</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                        <LuSparkles className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">
                        {matrix.status === "No iniciado"
                          ? "Esta matriz aún no ha sido confeccionada"
                          : "No hay registros de evaluación activos"}
                      </h4>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        Inicia el levantamiento guiado en 5 etapas normativas: Proceso/Tarea, Identificación del Peligro,
                        Evaluación VEP, Medidas de Control y Reevaluación.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsWizardOpen(true)}
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                      >
                        <LuSparkles className="w-4 h-4" />
                        Iniciar edición de la matriz (5 etapas)
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-teal-50/20 transition">
                    <td className="py-3.5 px-4 font-mono text-center text-gray-400 font-semibold align-top">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <p className="font-bold text-gray-900 leading-snug">{row.task}</p>
                      <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block mt-1 font-medium">
                        {row.process}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <p className="font-semibold text-amber-800 leading-snug">⚠️ {row.hazard}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{row.riskEvent}</p>
                    </td>

                    <td className="py-3.5 px-4 align-top text-center">
                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-lg font-bold text-[11px] inline-block shadow-2xs",
                          row.initialLevel === "Crítico" && "bg-red-100 text-red-700 border border-red-200",
                          row.initialLevel === "Alto" && "bg-amber-100 text-amber-800 border border-amber-200",
                          row.initialLevel === "Medio" && "bg-yellow-100 text-yellow-800 border border-yellow-200",
                          row.initialLevel === "Bajo" && "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        )}
                      >
                        MR {row.riskInitial}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        P:{row.probInitial} × S:{row.sevInitial}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <p className="text-gray-700 text-xs leading-relaxed">{row.controls}</p>
                    </td>

                    <td className="py-3.5 px-4 align-top text-center">
                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-lg font-bold text-[11px] inline-block shadow-2xs",
                          row.residualLevel === "Crítico" && "bg-red-100 text-red-700 border border-red-200",
                          row.residualLevel === "Alto" && "bg-amber-100 text-amber-800 border border-amber-200",
                          row.residualLevel === "Medio" && "bg-yellow-100 text-yellow-800 border border-yellow-200",
                          row.residualLevel === "Bajo" && "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        )}
                      >
                        ER {row.riskResidual}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        P:{row.probResidual} × S:{row.sevResidual}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span
                        className={clsx(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1",
                          row.controlStatus === "Implementado" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          row.controlStatus === "En proceso" && "bg-blue-50 text-blue-700 border-blue-200",
                          row.controlStatus === "Pendiente" && "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        <span
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            row.controlStatus === "Implementado" && "bg-emerald-500",
                            row.controlStatus === "En proceso" && "bg-blue-500",
                            row.controlStatus === "Pendiente" && "bg-amber-500"
                          )}
                        />
                        {row.controlStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditEvaluation(row)}
                          title="Editar evaluación"
                          className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        >
                          <LuPencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar la evaluación "${row.task}"?`)) {
                              setEvaluations(evaluations.filter((e) => e.id !== row.id));
                            }
                          }}
                          title="Eliminar"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <LuTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: AGREGAR / EDITAR PELIGRO Y EVALUACIÓN
          ========================================================================= */}
      {isAddEvaluationOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddEvaluationOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {editingRow ? "Editar Evaluación de Peligro" : "Agregar Peligro a la Matriz"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Identifica la tarea, el peligro asociado y define los controles obligatorios según DS 44.
            </p>

            <form onSubmit={handleSaveEvaluation} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Proceso / Área Operativa
                </label>
                <input
                  type="text"
                  required
                  value={formProcess}
                  onChange={(e) => setFormProcess(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Tarea Específica Evaluada
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Maniobras de izaje con grúa torre en altura"
                  value={formTask}
                  onChange={(e) => setFormTask(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Peligro Identificado
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Falla en eslingas / Sobrecarga"
                    value={formHazard}
                    onChange={(e) => setFormHazard(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Evento / Consecuencia
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Caída de carga suspendida / Aplastamiento"
                    value={formRiskEvent}
                    onChange={(e) => setFormRiskEvent(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                  />
                </div>
              </div>

              {/* Evaluación Inicial */}
              <div className="p-3.5 bg-red-50/50 border border-red-100 rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-red-900">
                  Evaluación de Riesgo Inicial (P × S = MR {formProb * formSev} - {calculateLevel(formProb * formSev)})
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Probabilidad Inicial (1 a 5): {formProb}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formProb}
                      onChange={(e) => setFormProb(Number(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Severidad Inicial (1 a 5): {formSev}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formSev}
                      onChange={(e) => setFormSev(Number(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Jerarquía de Controles */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Medidas de Control Preventivas (Jerarquía DS 44)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalla las barreras duras, controles de ingeniería, procedimientos y EPP requeridos..."
                  value={formControls}
                  onChange={(e) => setFormControls(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                />
              </div>

              {/* Evaluación Residual */}
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-emerald-900">
                  Evaluación de Riesgo Residual (P × S = ER {formProbRes * formSevRes} - {calculateLevel(formProbRes * formSevRes)})
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Probabilidad Residual: {formProbRes}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formProbRes}
                      onChange={(e) => setFormProbRes(Number(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Severidad Residual: {formSevRes}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formSevRes}
                      onChange={(e) => setFormSevRes(Number(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Estado de Implementación de los Controles
                </label>
                <select
                  value={formControlStatus}
                  onChange={(e) => setFormControlStatus(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 bg-white"
                >
                  <option value="Implementado">Implementado</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddEvaluationOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#F04438] hover:bg-[#D92D20] rounded-xl transition cursor-pointer shadow-xs"
                >
                  <LuSave className="w-4 h-4" />
                  {editingRow ? "Guardar Cambios" : "Agregar a la Matriz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDITAR DATOS GENERALES DE LA MATRIZ
          ========================================================================= */}
      {isEditGeneralOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setIsEditGeneralOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Editar Matriz IPER</h3>
            <p className="text-xs text-gray-500 mb-4">
              Modifica los datos principales y el estado de vigencia de esta matriz.
            </p>

            <form onSubmit={handleSaveGeneral} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Nombre de la Matriz / Proceso
                </label>
                <input
                  type="text"
                  required
                  value={generalName}
                  onChange={(e) => setGeneralName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Centro de Trabajo
                </label>
                <input
                  type="text"
                  required
                  value={generalWorkCenter}
                  onChange={(e) => setGeneralWorkCenter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Responsable
                </label>
                <input
                  type="text"
                  required
                  value={generalResponsible}
                  onChange={(e) => setGeneralResponsible(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Estado de la Matriz
                </label>
                <select
                  value={generalStatus}
                  onChange={(e) => setGeneralStatus(e.target.value as MatrixStatus)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 bg-white"
                >
                  <option value="Vigente">Vigente</option>
                  <option value="En revisión">En revisión</option>
                  <option value="Borrador">Borrador</option>
                  <option value="Observada">Observada</option>
                  <option value="En actualización">En actualización</option>
                  <option value="En aprobación">En aprobación</option>
                  <option value="Vencida">Vencida</option>
                  <option value="Rechazada">Rechazada</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditGeneralOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#F04438] hover:bg-[#D92D20] rounded-xl transition cursor-pointer shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Documento IRL por Cargo */}
      {isIrlModalOpen && (
        <IrlDocumentModal
          matrix={matrix}
          evaluations={evaluations}
          onClose={() => setIsIrlModalOpen(false)}
        />
      )}
    </div>
  );
}
