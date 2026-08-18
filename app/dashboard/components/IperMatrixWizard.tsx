"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  LuX,
  LuSave,
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuPlus,
  LuTrash2,
  LuInfo,
  LuShieldAlert,
  LuSparkles,
  LuCircleHelp,
  LuUsers,
  LuTriangleAlert,
  LuActivity,
  LuCircleCheck,
} from "react-icons/lu";
import { IperMatrixItem } from "./IperMatrixView";
import { IperEvaluationRow } from "./IperMatrixDetailView";

export interface WizardRecordData {
  // Etapa 1: Área, Proceso y Tarea
  process: string;
  subprocess: string;
  workArea: string;
  task: string;
  taskType: "Rutinaria" | "No rutinaria";
  jobPositions: string;
  headcountMen: number;
  headcountWomen: number;
  headcountDiversity: number;
  hasSensitivePeople: boolean;
  hasDisabledPeople: boolean;

  // Etapa 2: Identificación del Peligro
  hazardDescription: string;
  riskClassification: "Seguridad" | "Emergencias" | "Higiénicos" | "Psicosociales" | "Músculo-esquelético";
  riskFamily: string;
  specificRiskCode: string;
  specificRiskName: string;
  genderDifferences: "Si" | "No";
  genderObservation: string;

  // Etapa 3: Evaluación del Riesgo
  // Para Seguridad y Emergencias: VEP = P * C
  probValue: number; // 1, 2, 4 (o ACHS 1, 2, 6, 10)
  sevValue: number;  // 1, 2, 4 (o ACHS 10, 25, 60, 100)
  freqValue: number; // ACHS E: 1, 2, 60, 100
  // Para Higiénicos, Psicosociales, Músculo-esqueléticos
  protocolApplied: string;
  magnitudeRisk: "Bajo" | "Medio" | "Alto" | "Crítico";
  riskLevelLabel: string;
  initialScore: number;

  // Etapa 4: Medidas de Control
  controlsList: Array<{
    id: string;
    type: "Eliminar / Sustituir" | "Controles de Ingeniería" | "Controles Administrativos" | "Elementos de Protección Personal (EPP)";
    description: string;
    responsible: string;
  }>;

  // Etapa 5: Reevaluación del Riesgo
  residualProb: number;
  residualSev: number;
  residualScore: number;
  residualLevel: "Tolerable" | "Moderado" | "Importante" | "Intolerable" | "Bajo" | "Medio";
}

interface IperMatrixWizardProps {
  matrix: IperMatrixItem;
  onClose: () => void;
  onFinish: (newEvaluation: IperEvaluationRow, updatedMatrix: IperMatrixItem) => void;
}

// Catálogos Normalizados de Riesgo según ACHS y DS 44
const RISK_CATALOGS = {
  Seguridad: {
    families: [
      "Caídas a distinto nivel",
      "Caídas al mismo nivel",
      "Atrapamiento por o entre objetos",
      "Atropello o colisión con maquinaria",
      "Contacto con energía eléctrica",
      "Proyección de partículas o fragmentos",
      "Incendios y explosiones operativas",
    ],
    risks: [
      { code: "B1", name: "Caída desde altura física (> 1.8m)" },
      { code: "B2", name: "Caída de objetos / Carga suspendida" },
      { code: "B3", name: "Contacto con partes móviles sin resguardo" },
      { code: "B4", name: "Atropello por vehículo o maquinaria en movimiento" },
      { code: "B5", name: "Contacto con conductores eléctricos energizados" },
      { code: "B6", name: "Golpe por herramientas o estructuras colapsadas" },
    ],
  },
  Emergencias: {
    families: [
      "Incendio estructural o de faena",
      "Sismos y terremotos de alta intensidad",
      "Fuga o derrame masivo de sustancias peligrosas",
      "Colapso estructural / Derrumbe",
    ],
    risks: [
      { code: "E1", name: "Amago o incendio con atrapamiento de personal" },
      { code: "E2", name: "Evacuación masiva por evento sísmico / tsunami" },
      { code: "E3", name: "Intoxicación masiva por derrame de químicos" },
      { code: "E4", name: "Atrapamiento en zanjas o derrumbe de talud" },
    ],
  },
  Higiénicos: {
    families: [
      "Agentes físicos (Ruido, Vibraciones, Radiación)",
      "Agentes químicos (Polvo sílice, Solventes, Gases)",
      "Agentes biológicos (Hantavirus, COVID, Bacterias)",
    ],
    risks: [
      { code: "H1", name: "Exposición a Ruido Ocupacional (PREXOR)" },
      { code: "H2", name: "Exposición a Sílice Libre Cristalizada (PLANESI)" },
      { code: "H3", name: "Radiación Ultravioleta de Origen Solar (Guía UV)" },
      { code: "H4", name: "Exposición a Vapores Orgánicos y Solventes" },
    ],
  },
  Psicosociales: {
    families: [
      "Organización y condiciones del trabajo",
      "Relaciones interpersonales y liderazgo",
      "Violencia en el trabajo y Ley Karin",
    ],
    risks: [
      { code: "PS1", name: "Carga de trabajo y exigencias cuantitativas elevadas" },
      { code: "PS2", name: "Doble presencia e interferencia trabajo-familia" },
      { code: "PS3", name: "Violencia laboral, acoso moral o sexual (Ley Karin)" },
      { code: "PS4", name: "Falta de claridad de rol y escaso reconocimiento" },
    ],
  },
  "Músculo-esquelético": {
    families: [
      "Manejo manual de carga (MMC)",
      "Movimientos repetitivos extremidades superiores (TMERT)",
      "Posturas forzadas o mantenidas",
    ],
    risks: [
      { code: "ME1", name: "Manejo Manual de Cargas > 25 kg (Ley 20.001)" },
      { code: "ME2", name: "Trastornos Músculo-Esqueléticos EESS (TMERT-EESS)" },
      { code: "ME3", name: "Postura bípeda o sedente prolongada > 4 horas" },
    ],
  },
};

export default function IperMatrixWizard({ matrix, onClose, onFinish }: IperMatrixWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State Inicial
  const [formData, setFormData] = useState<WizardRecordData>({
    // Etapa 1
    process: matrix.name || "Operaciones Generales",
    subprocess: "Montaje y Mantenimiento",
    workArea: matrix.workCenter || "Planta Central",
    task: "",
    taskType: "Rutinaria",
    jobPositions: "Operador de Maquinaria, Ayudante Técnico",
    headcountMen: 8,
    headcountWomen: 2,
    headcountDiversity: 0,
    hasSensitivePeople: false,
    hasDisabledPeople: false,

    // Etapa 2
    hazardDescription: "",
    riskClassification: "Seguridad",
    riskFamily: "Caídas a distinto nivel",
    specificRiskCode: "B1",
    specificRiskName: "Caída desde altura física (> 1.8m)",
    genderDifferences: "No",
    genderObservation: "",

    // Etapa 3
    probValue: 2,
    sevValue: 4,
    freqValue: 2,
    protocolApplied: "DS 44 - Evaluación de Riesgos Generales",
    magnitudeRisk: "Alto",
    riskLevelLabel: "Importante",
    initialScore: 8, // 2 * 4

    // Etapa 4
    controlsList: [
      {
        id: "c-1",
        type: "Controles de Ingeniería",
        description: "Instalación de barandas perimetrales rígidas y líneas de vida de acero certificadas.",
        responsible: matrix.responsible || "Sergio A. Jara Astete",
      },
      {
        id: "c-2",
        type: "Controles Administrativos",
        description: "Procedimiento de Trabajo Seguro (PTS), check-list diario y examen de altura física al día.",
        responsible: matrix.responsible || "Sergio A. Jara Astete",
      },
      {
        id: "c-3",
        type: "Elementos de Protección Personal (EPP)",
        description: "Arnés de cuerpo entero con amortiguador de impacto y doble cabo de vida.",
        responsible: matrix.responsible || "Sergio A. Jara Astete",
      },
    ],

    // Etapa 5
    residualProb: 1,
    residualSev: 2,
    residualScore: 2,
    residualLevel: "Tolerable",
  });

  // State para agregar nueva medida de control en Etapa 4
  const [newControlType, setNewControlType] = useState<WizardRecordData["controlsList"][0]["type"]>("Controles de Ingeniería");
  const [newControlDesc, setNewControlDesc] = useState("");
  const [isAddingControl, setIsAddingControl] = useState(false);

  // Cálculos dinámicos
  const isHealthOrEmergency = formData.riskClassification === "Seguridad" || formData.riskClassification === "Emergencias";

  // Cálculo VEP para Seguridad / Emergencia: P * C (1, 2, 4)
  const vepScore = formData.probValue * formData.sevValue;
  const getVepLevel = (score: number) => {
    if (score >= 16) return { label: "Intolerable", color: "text-red-600 bg-red-50 border-red-200" };
    if (score >= 8) return { label: "Importante", color: "text-orange-600 bg-orange-50 border-orange-200" };
    if (score >= 4) return { label: "Moderado", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { label: "Tolerable", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  };

  // Reevaluación residual calculada
  const residualScoreCalc = formData.residualProb * formData.residualSev;

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddControl = () => {
    if (!newControlDesc.trim()) return;
    const newControlItem = {
      id: `c-${Date.now()}`,
      type: newControlType,
      description: newControlDesc,
      responsible: matrix.responsible || "Sergio A. Jara Astete",
    };
    setFormData({
      ...formData,
      controlsList: [...formData.controlsList, newControlItem],
    });
    setNewControlDesc("");
    setIsAddingControl(false);
  };

  const handleRemoveControl = (id: string) => {
    setFormData({
      ...formData,
      controlsList: formData.controlsList.filter((c) => c.id !== id),
    });
  };

  const handleFinishWizard = () => {
    // Generar la fila de evaluación final estructurada
    const newEvaluation: IperEvaluationRow = {
      id: `EV-${Date.now().toString().slice(-4)}`,
      process: formData.process,
      task: formData.task || `Operación de ${formData.subprocess || formData.process}`,
      hazard: formData.hazardDescription || formData.specificRiskName,
      riskEvent: `Exposición a ${formData.specificRiskName} en ${formData.workArea}`,
      probInitial: formData.probValue,
      sevInitial: formData.sevValue,
      riskInitial: vepScore,
      initialLevel: vepScore >= 16 ? "Crítico" : vepScore >= 8 ? "Alto" : vepScore >= 4 ? "Medio" : "Bajo",
      controls: formData.controlsList.map((c) => `[${c.type}] ${c.description}`).join(" • "),
      probResidual: formData.residualProb,
      sevResidual: formData.residualSev,
      riskResidual: residualScoreCalc,
      residualLevel: residualScoreCalc >= 8 ? "Medio" : "Bajo",
      controlStatus: "Implementado",
      responsible: matrix.responsible,
    };

    // Actualizar el estado de la matriz a 'Vigente' o 'En revisión'
    const updatedMatrix: IperMatrixItem = {
      ...matrix,
      status: "En revisión",
      totalRecords: typeof matrix.totalRecords === "number" ? matrix.totalRecords + 1 : 1,
      intolerableRisks: vepScore >= 16 ? 1 : 0,
    };

    onFinish(newEvaluation, updatedMatrix);
  };

  const stepsHeader = [
    { num: 1, label: "Proceso y tarea" },
    { num: 2, label: "Identificación de peligro" },
    { num: 3, label: "Evaluación del riesgo" },
    { num: 4, label: "Medidas de control" },
    { num: 5, label: "Reevaluación del riesgo" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col font-[family-name:var(--font-poppins)] overflow-y-auto animate-in fade-in duration-200">
      {/* 1. Header Superior del Wizard */}
      <header className="bg-white border-b border-gray-200 py-3.5 px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-[#F04438] tracking-tight">Life</span>
            <span className="text-lg font-black text-[#0D9488] tracking-tight">On</span>
          </div>
          <div className="h-4 w-px bg-gray-300 mx-1" />
          <span className="text-xs font-semibold text-gray-700">
            Confección de Matriz IPER &bull; <span className="text-teal-700 font-bold">{matrix.code}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-xl transition cursor-pointer"
          >
            <LuSave className="w-3.5 h-3.5" />
            Guardar borrador
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Barra de Progreso / Stepper */}
      <div className="bg-white border-b border-gray-100 py-3 px-6 shadow-2xs sticky top-[57px] z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          {stepsHeader.map((step, idx) => {
            const isCompleted = step.num < currentStep;
            const isCurrent = step.num === currentStep;

            return (
              <div key={step.num} className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.num)}
                  className={clsx(
                    "flex items-center gap-2 text-xs font-semibold transition cursor-pointer",
                    isCurrent && "text-teal-700 font-bold",
                    isCompleted && "text-gray-700",
                    !isCurrent && !isCompleted && "text-gray-400"
                  )}
                >
                  <span
                    className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition",
                      isCurrent && "bg-teal-600 text-white shadow-xs",
                      isCompleted && "bg-emerald-100 text-emerald-700 border border-emerald-300",
                      !isCurrent && !isCompleted && "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isCompleted ? <LuCheck className="w-3.5 h-3.5" /> : step.num}
                  </span>
                  <span>{step.label}</span>
                </button>

                {idx < stepsHeader.length - 1 && (
                  <div
                    className={clsx(
                      "w-8 sm:w-12 h-0.5 mx-1",
                      step.num < currentStep ? "bg-teal-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Contenedor Principal: 2 Columnas (Formulario + Resumen en Vivo) */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Formulario de la Etapa (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between min-h-[540px]">
          {/* =========================================================================
              ETAPA 1: PROCESO Y TAREA
              ========================================================================= */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Proceso y tarea</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Levantamiento del proceso operativo donde se identifica el peligro (Anexo A - DS 44).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Proceso</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Movimiento de tierras / Perforación"
                    value={formData.process}
                    onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Subproceso (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Tronadura / Aculatamiento"
                    value={formData.subprocess}
                    onChange={(e) => setFormData({ ...formData, subprocess: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Área de trabajo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Mina Rajo - Sector Norte"
                    value={formData.workArea}
                    onChange={(e) => setFormData({ ...formData, workArea: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Tarea específica</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carguío e iniciación de explosivos"
                    value={formData.task}
                    onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Puestos de trabajo / Cargos involucrados
                </label>
                <input
                  type="text"
                  placeholder="Ej: Operador de perforadora, Ayudante de tronadura, Rigger"
                  value={formData.jobPositions}
                  onChange={(e) => setFormData({ ...formData, jobPositions: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Tipo de Tarea */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Tipo de tarea</label>
                <div className="flex items-center gap-6 text-xs text-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="taskType"
                      checked={formData.taskType === "Rutinaria"}
                      onChange={() => setFormData({ ...formData, taskType: "Rutinaria" })}
                      className="accent-teal-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Rutinaria</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="taskType"
                      checked={formData.taskType === "No rutinaria"}
                      onChange={() => setFormData({ ...formData, taskType: "No rutinaria" })}
                      className="accent-teal-600 w-4 h-4 cursor-pointer"
                    />
                    <span>No rutinaria</span>
                  </label>
                </div>
              </div>

              {/* Número de personas e identidad sexogenérica */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Número de personas e identidad sexogenérica
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-1.5">
                    <input
                      type="number"
                      min="0"
                      value={formData.headcountMen}
                      onChange={(e) => setFormData({ ...formData, headcountMen: Number(e.target.value) })}
                      className="w-12 bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500 ml-auto font-medium">Hombres</span>
                  </div>

                  <div className="flex items-center bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-1.5">
                    <input
                      type="number"
                      min="0"
                      value={formData.headcountWomen}
                      onChange={(e) => setFormData({ ...formData, headcountWomen: Number(e.target.value) })}
                      className="w-12 bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500 ml-auto font-medium">Mujeres</span>
                  </div>

                  <div className="flex items-center bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-1.5">
                    <input
                      type="number"
                      min="0"
                      value={formData.headcountDiversity}
                      onChange={(e) => setFormData({ ...formData, headcountDiversity: Number(e.target.value) })}
                      className="w-12 bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500 ml-auto font-medium">Diversidades</span>
                  </div>
                </div>
              </div>

              {/* Toggles: Personas sensibles / con discapacidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-700 font-medium">Personas especialmente sensibles</span>
                  <input
                    type="checkbox"
                    checked={formData.hasSensitivePeople}
                    onChange={(e) => setFormData({ ...formData, hasSensitivePeople: e.target.checked })}
                    className="toggle-checkbox w-4 h-4 accent-teal-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-700 font-medium">Personas con discapacidad</span>
                  <input
                    type="checkbox"
                    checked={formData.hasDisabledPeople}
                    onChange={(e) => setFormData({ ...formData, hasDisabledPeople: e.target.checked })}
                    className="toggle-checkbox w-4 h-4 accent-teal-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ETAPA 2: IDENTIFICACIÓN DEL PELIGRO
              ========================================================================= */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Identificación del peligro y factores de riesgo</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Describe el peligro y clasifícalo según el catálogo normalizado ACHS / DS 44 (Anexo C).
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Descripción del peligro y factores de riesgo
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe la condición, acto o fuente con potencial de causar daño..."
                  value={formData.hazardDescription}
                  onChange={(e) => setFormData({ ...formData, hazardDescription: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Clasificación del Riesgo */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Clasificación del riesgo</label>
                <div className="flex items-center gap-3 flex-wrap text-xs text-gray-700">
                  {(["Seguridad", "Emergencias", "Higiénicos", "Psicosociales", "Músculo-esquelético"] as const).map((cat) => (
                    <label
                      key={cat}
                      className={clsx(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer transition",
                        formData.riskClassification === cat
                          ? "bg-teal-50 border-teal-500 text-teal-800 font-bold"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="riskClass"
                        checked={formData.riskClassification === cat}
                        onChange={() => {
                          const catData = RISK_CATALOGS[cat];
                          setFormData({
                            ...formData,
                            riskClassification: cat,
                            riskFamily: catData.families[0],
                            specificRiskCode: catData.risks[0].code,
                            specificRiskName: catData.risks[0].name,
                          });
                        }}
                        className="hidden"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Familia del Riesgo y Riesgo Específico (Anexo C) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Familia del riesgo</label>
                  <select
                    value={formData.riskFamily}
                    onChange={(e) => setFormData({ ...formData, riskFamily: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {RISK_CATALOGS[formData.riskClassification].families.map((fam) => (
                      <option key={fam} value={fam}>
                        {fam}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Riesgo específico (Código Anexo C)
                  </label>
                  <select
                    value={formData.specificRiskCode}
                    onChange={(e) => {
                      const found = RISK_CATALOGS[formData.riskClassification].risks.find((r) => r.code === e.target.value);
                      if (found) {
                        setFormData({
                          ...formData,
                          specificRiskCode: found.code,
                          specificRiskName: found.name,
                        });
                      }
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                  >
                    {RISK_CATALOGS[formData.riskClassification].risks.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.code} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Perspectiva de Género */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex flex-col gap-3">
                <span className="text-xs font-bold text-teal-900">Perspectiva de género</span>
                <p className="text-[11px] text-gray-600">
                  ¿Existen diferencias en exposición o consecuencias por identidad sexogenérica?
                </p>

                <div className="flex items-center gap-6 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="genderDiff"
                      checked={formData.genderDifferences === "Si"}
                      onChange={() => setFormData({ ...formData, genderDifferences: "Si" })}
                      className="accent-teal-600"
                    />
                    <span>Sí, hay diferencias</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="genderDiff"
                      checked={formData.genderDifferences === "No"}
                      onChange={() => setFormData({ ...formData, genderDifferences: "No" })}
                      className="accent-teal-600"
                    />
                    <span>No</span>
                  </label>
                </div>

                {formData.genderDifferences === "Si" && (
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Observación / Justificación técnica
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Explica las diferencias ergonómicas, biológicas o de equipamiento EPP..."
                      value={formData.genderObservation}
                      onChange={(e) => setFormData({ ...formData, genderObservation: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              ETAPA 3: EVALUACIÓN DEL RIESGO
              ========================================================================= */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Evaluación del riesgo</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isHealthOrEmergency
                    ? "Evaluación cuantitativa mediante Valor Esperado de Pérdida VEP (Probabilidad × Consecuencia) o Metodología ACHS."
                    : `Evaluación de riesgo ${formData.riskClassification} por protocolo específico aplicado.`}
                </p>
              </div>

              {/* Si es Seguridad / Emergencia: VEP = P * C */}
              {isHealthOrEmergency ? (
                <div className="flex flex-col gap-4">
                  {/* Probabilidad (P) */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      Probabilidad (P) - Grado de exposición o deficiencia
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { val: 1, label: "Baja (1)", desc: "Situación controlada" },
                        { val: 2, label: "Media (2)", desc: "Materialización posible" },
                        { val: 4, label: "Alta (4)", desc: "Situación deficiente" },
                        { val: 10, label: "Muy alta (10)", desc: "Muy deficiente / Inminente" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, probValue: item.val })}
                          className={clsx(
                            "p-3 rounded-xl border text-left transition cursor-pointer",
                            formData.probValue === item.val
                              ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">{item.label}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Consecuencia (C) */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      Consecuencia (C) - Severidad máxima esperada
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { val: 1, label: "Leves (1)", desc: "Sin tratamiento médico" },
                        { val: 2, label: "Menos graves (2)", desc: "Lesiones medias / CTP" },
                        { val: 4, label: "Graves (4)", desc: "Incapacidad / Secuela" },
                        { val: 10, label: "Fatal (10)", desc: "Muerte / Invalidez total" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, sevValue: item.val })}
                          className={clsx(
                            "p-3 rounded-xl border text-left transition cursor-pointer",
                            formData.sevValue === item.val
                              ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">{item.label}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resultado VEP Calculado */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-700">Valor Esperado de Pérdida (VEP)</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Cálculo: Probabilidad ({formData.probValue}) &times; Consecuencia ({formData.sevValue}) ={" "}
                        <b className="text-gray-900">{vepScore} pts</b>
                      </p>
                    </div>

                    <span
                      className={clsx(
                        "px-3 py-1 rounded-xl text-xs font-black border uppercase tracking-wider",
                        getVepLevel(vepScore).color
                      )}
                    >
                      {getVepLevel(vepScore).label}
                    </span>
                  </div>
                </div>
              ) : (
                /* Para Higiénicos, Psicosociales y Músculo-esqueléticos */
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Protocolo Ministerial / Guía Aplicada
                    </label>
                    <input
                      type="text"
                      value={formData.protocolApplied}
                      onChange={(e) => setFormData({ ...formData, protocolApplied: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      Nivel / Magnitud del Riesgo Evaluado
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {(["Bajo", "Medio", "Alto", "Crítico"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setFormData({ ...formData, magnitudeRisk: lvl })}
                          className={clsx(
                            "p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer",
                            formData.magnitudeRisk === lvl
                              ? "bg-teal-50 border-teal-500 text-teal-800 shadow-xs"
                              : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                          )}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              ETAPA 4: MEDIDAS DE CONTROL
              ========================================================================= */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Medidas de control y jerarquía</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Prioriza la jerarquía DS 44: eliminar o sustituir el peligro antes de recurrir a EPP.
                </p>
              </div>

              {/* Banner informativo de Jerarquía */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <LuInfo className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium">
                    <b>Jerarquía de Control (Mayor a menor eficacia):</b> Eliminación &gt; Sustitución &gt; Ingeniería &gt;
                    Administrativo &gt; EPP
                  </span>
                </div>
              </div>

              {/* Lista de Controles Agregados */}
              <div className="flex flex-col gap-2.5">
                {formData.controlsList.map((ctrl, idx) => (
                  <div
                    key={ctrl.id}
                    className="p-3.5 bg-[#F8FAFC] border border-gray-200 rounded-xl flex items-start justify-between gap-3 hover:border-gray-300 transition"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 uppercase">
                        {ctrl.type}
                      </span>
                      <p className="text-xs font-semibold text-gray-800 mt-1.5 leading-relaxed">{ctrl.description}</p>
                      <p className="text-[11px] text-gray-400 mt-1">Responsable: {ctrl.responsible}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveControl(ctrl.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition cursor-pointer"
                    >
                      <LuTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Botón / Formulario para Agregar Nuevo Control */}
              {isAddingControl ? (
                <div className="p-4 bg-white border-2 border-teal-500 rounded-2xl flex flex-col gap-3 shadow-xs">
                  <h4 className="text-xs font-bold text-gray-900">Nueva Medida de Control</h4>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Categoría según Jerarquía DS 44
                    </label>
                    <select
                      value={newControlType}
                      onChange={(e) => setNewControlType(e.target.value as any)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800"
                    >
                      <option value="Eliminar / Sustituir">1. Eliminar o Sustituir</option>
                      <option value="Controles de Ingeniería">2. Controles de Ingeniería</option>
                      <option value="Controles Administrativos">3. Controles Administrativos</option>
                      <option value="Elementos de Protección Personal (EPP)">4. Elementos de Protección Personal (EPP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Descripción de la medida preventiva
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detalla la acción preventiva específica..."
                      value={newControlDesc}
                      onChange={(e) => setNewControlDesc(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2 text-xs text-gray-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingControl(false)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddControl}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer shadow-xs"
                    >
                      Guardar Medida
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingControl(true)}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-teal-500 rounded-xl p-3.5 text-xs font-semibold text-gray-600 hover:text-teal-700 flex items-center justify-center gap-2 transition cursor-pointer bg-gray-50/50"
                >
                  <LuPlus className="w-4 h-4" />
                  + Agregar medida de control
                </button>
              )}
            </div>
          )}

          {/* =========================================================================
              ETAPA 5: REEVALUACIÓN DEL RIESGO
              ========================================================================= */}
          {currentStep === 5 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Reevaluación del riesgo residual</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Reevalúa el riesgo considerando las medidas de control adoptadas. El valor residual debe ser menor al inicial.
                </p>
              </div>

              {/* Comparador Visual Inicial vs Residual */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl text-center">
                  <span className="text-[11px] font-bold text-red-800 uppercase">Riesgo Inicial (P &times; C)</span>
                  <p className="text-2xl font-black text-red-600 my-1">{vepScore} pts</p>
                  <span className="text-[10px] font-semibold text-red-700">
                    {getVepLevel(vepScore).label}
                  </span>
                </div>

                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">Riesgo Residual Reevaluado</span>
                  <p className="text-2xl font-black text-emerald-600 my-1">{residualScoreCalc} pts</p>
                  <span className="text-[10px] font-semibold text-emerald-700">
                    {residualScoreCalc <= 2 ? "Tolerable (Bajo)" : "Moderado"}
                  </span>
                </div>
              </div>

              {/* Sliders para Reevaluación Residual */}
              <div className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>Probabilidad Residual con Controles:</span>
                    <span className="text-teal-700 font-bold">{formData.residualProb} (Baja)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    value={formData.residualProb}
                    onChange={(e) => setFormData({ ...formData, residualProb: Number(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>Severidad / Consecuencia Residual:</span>
                    <span className="text-teal-700 font-bold">{formData.residualSev} (Controlada)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    value={formData.residualSev}
                    onChange={(e) => setFormData({ ...formData, residualSev: Number(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900">
                <LuCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <b>Riesgo mitigado con éxito:</b> El valor residual ({residualScoreCalc}) es menor al valor inicial ({vepScore}).
                </span>
              </div>
            </div>
          )}

          {/* 4. Botones de Navegación Inferiores */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#F04438] bg-white border border-[#F04438] hover:bg-red-50 rounded-xl transition cursor-pointer"
              >
                <LuArrowLeft className="w-4 h-4" />
                Atrás
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#F04438] hover:bg-[#D92D20] rounded-xl transition cursor-pointer shadow-xs"
              >
                Siguiente
                <LuArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishWizard}
                className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer shadow-xs"
              >
                <LuCheck className="w-4 h-4" />
                Guardar registro y finalizar
              </button>
            )}
          </div>
        </div>

        {/* Columna Derecha: Resumen en Vivo del Registro & Tarjetas Informativas (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-[130px]">
          {/* Tarjeta de Resumen en Vivo */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col gap-3">
            <h4 className="text-sm font-bold text-gray-900">Resumen del registro</h4>

            <div className="flex flex-col gap-2 text-xs text-gray-600 divide-y divide-gray-100">
              <div className="pt-1.5">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Proceso &bull; Subproceso</p>
                <p className="font-semibold text-gray-800">
                  {formData.process} {formData.subprocess && `&bull; ${formData.subprocess}`}
                </p>
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Área de trabajo</p>
                <p className="font-semibold text-gray-800">{formData.workArea || "-"}</p>
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Tarea</p>
                <p className="font-semibold text-gray-800">{formData.task || "Sin definir aún"}</p>
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Puestos de trabajo</p>
                <p className="text-gray-700 text-[11px]">{formData.jobPositions || "-"}</p>
              </div>

              {currentStep >= 2 && (
                <div className="pt-2">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Peligro & Clasificación</p>
                  <p className="font-semibold text-gray-800">
                    {formData.specificRiskCode} - {formData.specificRiskName}
                  </p>
                </div>
              )}

              {currentStep >= 3 && (
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Nivel de Riesgo Inicial</p>
                    <p className="font-bold text-gray-900">VEP {vepScore} pts</p>
                  </div>
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded text-[10px] font-bold border",
                      getVepLevel(vepScore).color
                    )}
                  >
                    {getVepLevel(vepScore).label}
                  </span>
                </div>
              )}

              {currentStep >= 4 && (
                <div className="pt-2">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Medidas de Control</p>
                  <p className="font-semibold text-teal-700">{formData.controlsList.length} medidas definidas</p>
                </div>
              )}
            </div>
          </div>

          {/* Tarjetas de Ayuda Normativa según la Etapa */}
          {currentStep === 1 && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <LuInfo className="w-4 h-4 text-blue-600" />
                <span>Perspectiva de género (Anexo B)</span>
              </div>
              <p className="text-[11px] text-blue-800/90 leading-relaxed">
                Registra la composición sexogenérica y personas sensibles: la exposición y consecuencias pueden diferir
                entre grupos (Decreto Supremo N° 44).
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <LuInfo className="w-4 h-4 text-blue-600" />
                <span>Catálogo de riesgos (Anexo C)</span>
              </div>
              <p className="text-[11px] text-blue-800/90 leading-relaxed">
                Cada riesgo tiene un código normalizado (ej. B2). Esto permite consolidar y comparar entre centros de
                trabajo y exportar a la plantilla ACHS.
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs text-xs flex flex-col gap-2">
              <span className="font-bold text-gray-900">Escala de Nivel de Riesgo (DS 44 / ACHS)</span>
              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tolerable
                  </span>
                  <span className="text-gray-400 font-mono">1 - 3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderado
                  </span>
                  <span className="text-gray-400 font-mono">4 - 7</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-orange-700">
                    <span className="w-2 h-2 rounded-full bg-orange-500" /> Importante
                  </span>
                  <span className="text-gray-400 font-mono">8 - 15</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Intolerable
                  </span>
                  <span className="text-gray-400 font-mono">16 - 100</span>
                </div>
              </div>
            </div>
          )}

          {currentStep >= 4 && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <LuCheck className="w-4 h-4 text-emerald-600" />
                <span>Cierre del registro</span>
              </div>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                Al guardar, el registro se incorpora a la Matriz IPER y al Programa de Trabajo Preventivo (DS 44), con
                recordatorio de reevaluación.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
