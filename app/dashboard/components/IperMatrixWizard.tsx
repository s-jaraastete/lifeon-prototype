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
  LuMapPin,
  LuLayers,
  LuPencil,
  LuFolderTree,
} from "react-icons/lu";
import { IperMatrixItem } from "./IperMatrixView";
import { IperEvaluationRow } from "./IperMatrixDetailView";

export interface ProcessItem {
  id: string;
  name: string;
  subprocesses: string[]; // Un proceso puede tener uno o más subprocesos (opcional)
  workArea: string;
}

export interface TaskItem {
  id: string;
  processId: string;
  processName: string;
  subprocessName?: string;
  name: string;
  taskType: "Rutinaria" | "No rutinaria";
  jobPositions: string;
  headcountMen: number;
  headcountWomen: number;
  headcountDiversity: number;
  hasSensitivePeople: boolean;
  hasDisabledPeople: boolean;
}

export interface TaskHazardData {
  id: string;
  taskId: string;
  hazardDescription: string;
  riskClassification: "Seguridad" | "Emergencias" | "Higiénicos" | "Psicosociales" | "Músculo-esquelético";
  riskFamily: string;
  specificRiskCode: string;
  specificRiskName: string;
  genderDifferences: "Si" | "No";
  genderObservation: string;
  probValue: number;
  sevValue: number;
  protocolApplied: string;
  controlsList: Array<{
    id: string;
    type: "Eliminar / Sustituir" | "Controles de Ingeniería" | "Controles Administrativos" | "Elementos de Protección Personal (EPP)";
    description: string;
    responsible: string;
  }>;
  residualProb: number;
  residualSev: number;
}

interface IperMatrixWizardProps {
  matrix: IperMatrixItem;
  onClose: () => void;
  onFinish: (newEvaluations: IperEvaluationRow | IperEvaluationRow[], updatedMatrix: IperMatrixItem) => void;
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

  // 1. Estado de Área y Procesos (Un proceso puede tener uno o más subprocesos opcionales)
  const [workArea, setWorkArea] = useState<string>(matrix.workCenter || "Planta Quilicura");
  const [processes, setProcesses] = useState<ProcessItem[]>([
    {
      id: "proc-1",
      name: matrix.name || "Operaciones de Faena y Movimiento de Cargas",
      subprocesses: ["Maniobras de Izaje y Montaje", "Tránsito de Maquinaria"],
      workArea: matrix.workCenter || "Planta Quilicura",
    },
  ]);
  const [newProcessName, setNewProcessName] = useState("");
  const [newSubprocessInput, setNewSubprocessInput] = useState("");

  // 2. Estado de Tareas (Una o más tareas por proceso / subproceso)
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "task-1",
      processId: "proc-1",
      processName: matrix.name || "Operaciones de Faena y Movimiento de Cargas",
      subprocessName: "Maniobras de Izaje y Montaje",
      name: "Operación de maquinaria pesada y maniobras en altura",
      taskType: "Rutinaria",
      jobPositions: "Operador de Maquinaria, Rigger, Técnico de Mantenimiento",
      headcountMen: 8,
      headcountWomen: 2,
      headcountDiversity: 0,
      hasSensitivePeople: false,
      hasDisabledPeople: false,
    },
  ]);

  // Formulario de Tarea en Etapa 2
  const [taskFormProcessId, setTaskFormProcessId] = useState("proc-1");
  const [taskFormSubprocess, setTaskFormSubprocess] = useState("Maniobras de Izaje y Montaje");
  const [taskFormName, setTaskFormName] = useState("");
  const [taskFormType, setTaskFormType] = useState<"Rutinaria" | "No rutinaria">("Rutinaria");
  const [taskFormPositions, setTaskFormPositions] = useState("");
  const [taskFormMen, setTaskFormMen] = useState(4);
  const [taskFormWomen, setTaskFormWomen] = useState(1);
  const [taskFormDiv, setTaskFormDiv] = useState(0);
  const [taskFormSensitive, setTaskFormSensitive] = useState(false);
  const [taskFormDisabled, setTaskFormDisabled] = useState(false);

  // 3. Estado de Peligros y Riesgos (Una tarea puede tener uno o más peligros)
  const [selectedTaskId, setSelectedTaskId] = useState<string>("task-1");

  const [hazardsMap, setHazardsMap] = useState<Record<string, TaskHazardData>>({
    "task-1": {
      id: "haz-1",
      taskId: "task-1",
      hazardDescription: "Pérdida de estabilidad en terreno irregular y caída de carga suspendida",
      riskClassification: "Seguridad",
      riskFamily: "Caídas a distinto nivel",
      specificRiskCode: "B1",
      specificRiskName: "Caída desde altura física (> 1.8m)",
      genderDifferences: "No",
      genderObservation: "",
      probValue: 2,
      sevValue: 4,
      protocolApplied: "DS 44 - Evaluación de Riesgos Operacionales",
      controlsList: [
        {
          id: "c-1",
          type: "Controles de Ingeniería",
          description: "Sensor de sobrecarga automático con corte de potencia y líneas de vida de acero certificadas.",
          responsible: matrix.responsible || "Ana Silva Catrileo",
        },
        {
          id: "c-2",
          type: "Controles Administrativos",
          description: "Procedimiento de Trabajo Seguro (PTS), check list pre-uso y examen de altura física vigente.",
          responsible: matrix.responsible || "Ana Silva Catrileo",
        },
        {
          id: "c-3",
          type: "Elementos de Protección Personal (EPP)",
          description: "Arnés de cuerpo entero con amortiguador de impacto y doble cabo de vida.",
          responsible: matrix.responsible || "Ana Silva Catrileo",
        },
      ],
      residualProb: 1,
      residualSev: 2,
    },
  });

  // Estado para agregar control en Etapa 5
  const [newControlType, setNewControlType] = useState<TaskHazardData["controlsList"][0]["type"]>("Controles de Ingeniería");
  const [newControlDesc, setNewControlDesc] = useState("");
  const [isAddingControl, setIsAddingControl] = useState(false);

  // Helper para obtener o inicializar los datos de peligro de la tarea activa
  const getActiveHazardData = (): TaskHazardData => {
    if (hazardsMap[selectedTaskId]) {
      return hazardsMap[selectedTaskId];
    }
    const defaultData: TaskHazardData = {
      id: `haz-${selectedTaskId}`,
      taskId: selectedTaskId,
      hazardDescription: "",
      riskClassification: "Seguridad",
      riskFamily: "Caídas a distinto nivel",
      specificRiskCode: "B1",
      specificRiskName: "Caída desde altura física (> 1.8m)",
      genderDifferences: "No",
      genderObservation: "",
      probValue: 2,
      sevValue: 4,
      protocolApplied: "DS 44 - Evaluación de Riesgos Generales",
      controlsList: [
        {
          id: `c-${Date.now()}`,
          type: "Controles Administrativos",
          description: "Procedimiento de trabajo seguro y capacitación obligatoria.",
          responsible: matrix.responsible || "Sergio A. Jara Astete",
        },
      ],
      residualProb: 1,
      residualSev: 2,
    };
    return defaultData;
  };

  const updateActiveHazard = (updates: Partial<TaskHazardData>) => {
    const current = getActiveHazardData();
    setHazardsMap({
      ...hazardsMap,
      [selectedTaskId]: {
        ...current,
        ...updates,
      },
    });
  };

  const activeHazard = getActiveHazardData();
  const activeTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  // Cálculo VEP para Seguridad / Emergencia: P * C
  const isHealthOrEmergency = activeHazard.riskClassification === "Seguridad" || activeHazard.riskClassification === "Emergencias";
  const vepScore = activeHazard.probValue * activeHazard.sevValue;
  const getVepLevel = (score: number) => {
    if (score >= 16) return { label: "Intolerable / Crítico", color: "text-red-600 bg-red-50 border-red-200" };
    if (score >= 8) return { label: "Importante / Alto", color: "text-orange-600 bg-orange-50 border-orange-200" };
    if (score >= 4) return { label: "Moderado / Medio", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { label: "Tolerable / Bajo", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  };

  const residualScoreCalc = activeHazard.residualProb * activeHazard.residualSev;

  // Handlers para Etapa 1 (Procesos y Subprocesos)
  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcessName.trim()) return;

    const subprocsList = newSubprocessInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newProc: ProcessItem = {
      id: `proc-${Date.now()}`,
      name: newProcessName.trim(),
      subprocesses: subprocsList,
      workArea: workArea,
    };
    setProcesses([...processes, newProc]);
    setNewProcessName("");
    setNewSubprocessInput("");
  };

  const handleAddSubprocessToProc = (procId: string, subName: string) => {
    if (!subName.trim()) return;
    setProcesses(
      processes.map((p) =>
        p.id === procId ? { ...p, subprocesses: [...p.subprocesses, subName.trim()] } : p
      )
    );
  };

  const handleRemoveSubprocessFromProc = (procId: string, subIndex: number) => {
    setProcesses(
      processes.map((p) =>
        p.id === procId ? { ...p, subprocesses: p.subprocesses.filter((_, idx) => idx !== subIndex) } : p
      )
    );
  };

  const handleRemoveProcess = (id: string) => {
    if (processes.length <= 1) return;
    setProcesses(processes.filter((p) => p.id !== id));
  };

  // Handlers para Etapa 2 (Tareas)
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormName.trim()) return;
    const selectedProc = processes.find((p) => p.id === taskFormProcessId) || processes[0];
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      processId: selectedProc.id,
      processName: selectedProc.name,
      subprocessName: taskFormSubprocess.trim() || undefined,
      name: taskFormName.trim(),
      taskType: taskFormType,
      jobPositions: taskFormPositions.trim() || "Operador de faena",
      headcountMen: taskFormMen,
      headcountWomen: taskFormWomen,
      headcountDiversity: taskFormDiv,
      hasSensitivePeople: taskFormSensitive,
      hasDisabledPeople: taskFormDisabled,
    };
    setTasks([...tasks, newTask]);
    setTaskFormName("");
    setTaskFormPositions("");
    setSelectedTaskId(newTask.id);
  };

  const handleRemoveTask = (id: string) => {
    if (tasks.length <= 1) return;
    const remaining = tasks.filter((t) => t.id !== id);
    setTasks(remaining);
    if (selectedTaskId === id) {
      setSelectedTaskId(remaining[0].id);
    }
  };

  // Handlers para Medidas de Control
  const handleAddControl = () => {
    if (!newControlDesc.trim()) return;
    const newControlItem = {
      id: `c-${Date.now()}`,
      type: newControlType,
      description: newControlDesc.trim(),
      responsible: matrix.responsible || "Ana Silva Catrileo",
    };
    updateActiveHazard({
      controlsList: [...activeHazard.controlsList, newControlItem],
    });
    setNewControlDesc("");
    setIsAddingControl(false);
  };

  const handleRemoveControl = (id: string) => {
    updateActiveHazard({
      controlsList: activeHazard.controlsList.filter((c) => c.id !== id),
    });
  };

  // Finalizar y Guardar en la Matriz
  const handleFinishWizard = () => {
    const generatedEvaluations: IperEvaluationRow[] = tasks.map((task) => {
      const hazardData = hazardsMap[task.id] || getActiveHazardData();
      const initialScore = hazardData.probValue * hazardData.sevValue;
      const residualScore = hazardData.residualProb * hazardData.residualSev;

      return {
        id: `EV-${Date.now().toString().slice(-4)}-${task.id.slice(-3)}`,
        process: task.processName,
        task: task.name,
        hazard: hazardData.hazardDescription || hazardData.specificRiskName,
        riskEvent: `Exposición a ${hazardData.specificRiskName} en ${workArea}`,
        probInitial: hazardData.probValue,
        sevInitial: hazardData.sevValue,
        riskInitial: initialScore,
        initialLevel: initialScore >= 16 ? "Crítico" : initialScore >= 8 ? "Alto" : initialScore >= 4 ? "Medio" : "Bajo",
        controls: hazardData.controlsList.map((c) => `[${c.type}] ${c.description}`).join(" • "),
        probResidual: hazardData.residualProb,
        sevResidual: hazardData.residualSev,
        riskResidual: residualScore,
        residualLevel: residualScore >= 8 ? "Medio" : "Bajo",
        controlStatus: "Implementado",
        responsible: matrix.responsible,
      };
    });

    const updatedMatrix: IperMatrixItem = {
      ...matrix,
      status: "En revisión",
      totalRecords: typeof matrix.totalRecords === "number" ? matrix.totalRecords + generatedEvaluations.length : generatedEvaluations.length,
      intolerableRisks: generatedEvaluations.filter((e) => e.initialLevel === "Crítico").length,
    };

    onFinish(generatedEvaluations, updatedMatrix);
  };

  const stepsHeader = [
    { num: 1, label: "Área y procesos", shortLabel: "Área" },
    { num: 2, label: "Tareas", shortLabel: "Tareas" },
    { num: 3, label: "Peligros", shortLabel: "Peligros" },
    { num: 4, label: "Evaluación del riesgo", shortLabel: "Evaluación" },
    { num: 5, label: "Medidas de control", shortLabel: "Controles" },
    { num: 6, label: "Reevaluación del riesgo", shortLabel: "Reevaluación" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col font-[family-name:var(--font-poppins)] overflow-y-auto animate-in fade-in duration-200">
      {/* 1. Header Superior del Wizard */}
      <header className="bg-white border-b border-gray-200 py-3.5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-[#F04438] tracking-tight">Life</span>
            <span className="text-lg font-black text-[#0D9488] tracking-tight">On</span>
          </div>
          <div className="h-4 w-px bg-gray-300 mx-1 hidden sm:block" />
          <span className="text-xs font-semibold text-gray-700 hidden sm:inline">
            Confección de Matriz IPER &bull; <span className="text-teal-700 font-bold">{matrix.code}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-xl transition cursor-pointer"
          >
            <LuSave className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guardar borrador</span>
            <span className="sm:hidden">Borrador</span>
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

      {/* 2. Barra de Progreso / Stepper (Completamente Fluida y SIN Barra de Desplazamiento Horizontal) */}
      <div className="bg-white border-b border-gray-100 py-2.5 px-3 sm:px-6 shadow-2xs sticky top-[57px] z-10 overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
          {stepsHeader.map((step, idx) => {
            const isCompleted = step.num < currentStep;
            const isCurrent = step.num === currentStep;

            return (
              <div key={step.num} className="flex items-center gap-1 sm:gap-2 flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.num)}
                  className={clsx(
                    "flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold transition cursor-pointer whitespace-nowrap",
                    isCurrent && "text-teal-700 font-bold",
                    isCompleted && "text-gray-700",
                    !isCurrent && !isCompleted && "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <span
                    className={clsx(
                      "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold transition flex-shrink-0",
                      isCurrent && "bg-teal-600 text-white shadow-xs",
                      isCompleted && "bg-emerald-100 text-emerald-700 border border-emerald-300",
                      !isCurrent && !isCompleted && "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isCompleted ? <LuCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : step.num}
                  </span>
                  <span className="hidden lg:inline">{step.label}</span>
                  <span className="inline lg:hidden">{step.shortLabel}</span>
                </button>

                {idx < stepsHeader.length - 1 && (
                  <div
                    className={clsx(
                      "flex-1 h-0.5 min-w-[6px] mx-1 sm:mx-2 transition-colors",
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
              ETAPA 1: ÁREA Y PROCESOS
              ========================================================================= */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                    <LuMapPin className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Área y Procesos Operativos</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Define el área de trabajo y los procesos de la faena. Cada proceso puede tener uno o más subprocesos (opcionales).
                    </p>
                  </div>
                </div>
              </div>

              {/* Área / Centro de Trabajo */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Área o Centro de Trabajo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Planta Quilicura / Mina Rajo Sector Norte"
                  value={workArea}
                  onChange={(e) => setWorkArea(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
                />
              </div>

              {/* Formulario para agregar procesos y subprocesos */}
              <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <LuFolderTree className="w-3.5 h-3.5 text-teal-600" />
                    + Agregar Proceso y Subprocesos
                  </h4>
                  <span className="text-[11px] text-gray-400 font-medium">Subprocesos opcionales</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">Nombre del Proceso</label>
                    <input
                      type="text"
                      placeholder="Ej: Operaciones de Faena, Bodega Química, Mantenimiento"
                      value={newProcessName}
                      onChange={(e) => setNewProcessName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      Subprocesos (Opcional, separados por coma)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Izaje, Montaje estructural, Soldadura"
                      value={newSubprocessInput}
                      onChange={(e) => setNewSubprocessInput(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddProcess}
                    disabled={!newProcessName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <LuPlus className="w-3.5 h-3.5" />
                    Agregar Proceso
                  </button>
                </div>
              </div>

              {/* Lista de Procesos y Subprocesos Configurados */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-2">
                  Estructura de Procesos ({processes.length})
                </h4>
                <div className="flex flex-col gap-3">
                  {processes.map((proc, idx) => (
                    <div
                      key={proc.id}
                      className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xs hover:border-teal-300 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{proc.name}</p>
                            <p className="text-[10px] text-gray-400">Área: {proc.workArea}</p>
                          </div>
                        </div>

                        {processes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProcess(proc.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Eliminar proceso"
                          >
                            <LuTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Chips de Subprocesos */}
                      <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-gray-400 font-medium mr-1">Subprocesos:</span>
                        {proc.subprocesses.length === 0 ? (
                          <span className="text-[11px] text-gray-400 italic">Sin subprocesos (se asignarán tareas directamente al proceso)</span>
                        ) : (
                          proc.subprocesses.map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[11px] font-medium"
                            >
                              {sub}
                              <button
                                type="button"
                                onClick={() => handleRemoveSubprocessFromProc(proc.id, sIdx)}
                                className="text-teal-600 hover:text-red-600 cursor-pointer ml-0.5"
                              >
                                &times;
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ETAPA 2: TAREAS (UNA O MÁS TAREAS POR PROCESO O SUBPROCESO)
              ========================================================================= */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                    <LuLayers className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Tareas por Proceso / Subproceso</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ingresa una o más tareas dentro de los procesos o subprocesos configurados en la etapa anterior.
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario de Nueva Tarea */}
              <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-4 flex flex-col gap-3.5">
                <h4 className="text-xs font-bold text-gray-800">+ Registrar Tarea</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      Proceso Perteneciente
                    </label>
                    <select
                      value={taskFormProcessId}
                      onChange={(e) => {
                        setTaskFormProcessId(e.target.value);
                        const selectedP = processes.find((p) => p.id === e.target.value);
                        if (selectedP && selectedP.subprocesses.length > 0) {
                          setTaskFormSubprocess(selectedP.subprocesses[0]);
                        } else {
                          setTaskFormSubprocess("");
                        }
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      {processes.map((proc) => (
                        <option key={proc.id} value={proc.id}>
                          {proc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector de Subproceso (si el proceso tiene subprocesos) */}
                  {(() => {
                    const selP = processes.find((p) => p.id === taskFormProcessId) || processes[0];
                    if (!selP || selP.subprocesses.length === 0) return null;
                    return (
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                          Subproceso (Opcional)
                        </label>
                        <select
                          value={taskFormSubprocess}
                          onChange={(e) => setTaskFormSubprocess(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                          <option value="">(Sin subproceso específico)</option>
                          {selP.subprocesses.map((sub, idx) => (
                            <option key={idx} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}

                  <div className={processes.find((p) => p.id === taskFormProcessId)?.subprocesses.length ? "sm:col-span-2" : ""}>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      Nombre de la Tarea Específica
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Montaje de andamios tubulares en fachada / Izaje de vigas"
                      value={taskFormName}
                      onChange={(e) => setTaskFormName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      Puestos de trabajo / Cargos involucrados
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Andamiero, Rigger, Supervisor"
                      value={taskFormPositions}
                      onChange={(e) => setTaskFormPositions(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">Tipo de Tarea</label>
                    <div className="flex items-center gap-4 text-xs text-gray-700 pt-1.5">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="formTaskType"
                          checked={taskFormType === "Rutinaria"}
                          onChange={() => setTaskFormType("Rutinaria")}
                          className="accent-teal-600"
                        />
                        <span>Rutinaria</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="formTaskType"
                          checked={taskFormType === "No rutinaria"}
                          onChange={() => setTaskFormType("No rutinaria")}
                          className="accent-teal-600"
                        />
                        <span>No rutinaria</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Dotación */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Dotación de personal involucrado
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1.5">
                      <input
                        type="number"
                        min="0"
                        value={taskFormMen}
                        onChange={(e) => setTaskFormMen(Number(e.target.value))}
                        className="w-10 bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                      />
                      <span className="text-[11px] text-gray-500 ml-auto font-medium">Hombres</span>
                    </div>

                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1.5">
                      <input
                        type="number"
                        min="0"
                        value={taskFormWomen}
                        onChange={(e) => setTaskFormWomen(Number(e.target.value))}
                        className="w-10 bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                      />
                      <span className="text-[11px] text-gray-500 ml-auto font-medium">Mujeres</span>
                    </div>

                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1.5">
                      <input
                        type="number"
                        min="0"
                        value={taskFormDiv}
                        onChange={(e) => setTaskFormDiv(Number(e.target.value))}
                        className="w-10 bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                      />
                      <span className="text-[11px] text-gray-500 ml-auto font-medium">Diversidad</span>
                    </div>
                  </div>
                </div>

                {/* Consideraciones especiales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 text-xs cursor-pointer">
                    <span className="text-gray-700">Personas especialmente sensibles</span>
                    <input
                      type="checkbox"
                      checked={taskFormSensitive}
                      onChange={(e) => setTaskFormSensitive(e.target.checked)}
                      className="w-4 h-4 accent-teal-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 text-xs cursor-pointer">
                    <span className="text-gray-700">Personas con discapacidad</span>
                    <input
                      type="checkbox"
                      checked={taskFormDisabled}
                      onChange={(e) => setTaskFormDisabled(e.target.checked)}
                      className="w-4 h-4 accent-teal-600"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddTask}
                    disabled={!taskFormName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <LuPlus className="w-3.5 h-3.5" />
                    Agregar Tarea a la Matriz
                  </button>
                </div>
              </div>

              {/* Lista de Tareas Agregadas */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-2">
                  Tareas Incorporadas ({tasks.length})
                </h4>
                <div className="flex flex-col gap-2.5">
                  {tasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className="bg-white border border-gray-200 rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-2xs hover:border-teal-300 transition"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900">{task.name}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              {task.taskType}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Proceso: <span className="font-semibold text-gray-700">{task.processName}</span>
                            {task.subprocessName ? ` ➔ Subproceso: ${task.subprocessName}` : ""}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1.5 flex-wrap">
                            <span>Puestos: {task.jobPositions}</span>
                            <span>•</span>
                            <span>
                              Dotación: {task.headcountMen} ♂ / {task.headcountWomen} ♀ / {task.headcountDiversity} ⚥
                            </span>
                          </div>
                        </div>
                      </div>

                      {tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(task.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Eliminar tarea"
                        >
                          <LuTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ETAPA 3: IDENTIFICACIÓN DEL PELIGRO (UNA TAREA PUEDE TENER UNO O MÁS PELIGROS)
              ========================================================================= */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Identificación del Peligro y Riesgos</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Identifica las fuentes, actos y condiciones peligrosas para cada tarea (Anexo C - DS 44).
                </p>
              </div>

              {/* Selector de Tarea a Evaluar (Wrap limpio sin scrollbar horizontal) */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-500 flex-shrink-0">Tarea activa:</span>
                {tasks.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTaskId(t.id)}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border text-left",
                      selectedTaskId === t.id
                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    T{idx + 1}: {t.name.length > 25 ? `${t.name.slice(0, 25)}...` : t.name}
                  </button>
                ))}
              </div>

              {/* Info de Tarea Activa */}
              <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Evaluando peligro para:</span>
                  <p className="font-bold text-teal-900 mt-0.5">{activeTask?.name}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800">
                  {activeTask?.processName} {activeTask?.subprocessName ? `(${activeTask.subprocessName})` : ""}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Descripción del peligro y factores de riesgo
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe la condición, acto o fuente con potencial de causar daño..."
                  value={activeHazard.hazardDescription}
                  onChange={(e) => updateActiveHazard({ hazardDescription: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Clasificación del Riesgo */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Clasificación del riesgo</label>
                <div className="flex items-center gap-2 flex-wrap text-xs text-gray-700">
                  {(["Seguridad", "Emergencias", "Higiénicos", "Psicosociales", "Músculo-esquelético"] as const).map((cat) => (
                    <label
                      key={cat}
                      className={clsx(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer transition",
                        activeHazard.riskClassification === cat
                          ? "bg-teal-50 border-teal-500 text-teal-800 font-bold"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="riskClass"
                        checked={activeHazard.riskClassification === cat}
                        onChange={() => {
                          const catData = RISK_CATALOGS[cat];
                          updateActiveHazard({
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
                    value={activeHazard.riskFamily}
                    onChange={(e) => updateActiveHazard({ riskFamily: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {RISK_CATALOGS[activeHazard.riskClassification].families.map((fam) => (
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
                    value={activeHazard.specificRiskCode}
                    onChange={(e) => {
                      const found = RISK_CATALOGS[activeHazard.riskClassification].risks.find((r) => r.code === e.target.value);
                      if (found) {
                        updateActiveHazard({
                          specificRiskCode: found.code,
                          specificRiskName: found.name,
                        });
                      }
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                  >
                    {RISK_CATALOGS[activeHazard.riskClassification].risks.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.code} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Perspectiva de Género */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-gray-800">Perspectiva de género</span>
                <p className="text-[11px] text-gray-500">
                  ¿Existen diferencias en exposición o consecuencias por identidad sexogenérica?
                </p>

                <div className="flex items-center gap-6 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="genderDiff"
                      checked={activeHazard.genderDifferences === "Si"}
                      onChange={() => updateActiveHazard({ genderDifferences: "Si" })}
                      className="accent-teal-600"
                    />
                    <span>Sí, hay diferencias</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="genderDiff"
                      checked={activeHazard.genderDifferences === "No"}
                      onChange={() => updateActiveHazard({ genderDifferences: "No" })}
                      className="accent-teal-600"
                    />
                    <span>No</span>
                  </label>
                </div>

                {activeHazard.genderDifferences === "Si" && (
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Observación / Justificación técnica
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Explica las diferencias ergonómicas, biológicas o de equipamiento EPP..."
                      value={activeHazard.genderObservation}
                      onChange={(e) => updateActiveHazard({ genderObservation: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              ETAPA 4: EVALUACIÓN DEL RIESGO
              ========================================================================= */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Evaluación del Riesgo Inicial</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isHealthOrEmergency
                    ? "Evaluación cuantitativa mediante Valor Esperado de Pérdida VEP (Probabilidad × Consecuencia) o Metodología ACHS."
                    : `Evaluación de riesgo ${activeHazard.riskClassification} por protocolo específico aplicado.`}
                </p>
              </div>

              {/* Selector de Tareas si hay varias */}
              {tasks.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-500 flex-shrink-0">Tarea activa:</span>
                  {tasks.map((t, idx) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTaskId(t.id)}
                      className={clsx(
                        "px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer border",
                        selectedTaskId === t.id
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      T{idx + 1}: {t.name.slice(0, 20)}...
                    </button>
                  ))}
                </div>
              )}

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
                          onClick={() => updateActiveHazard({ probValue: item.val })}
                          className={clsx(
                            "p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between",
                            activeHazard.probValue === item.val
                              ? "bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20 font-bold"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <span className="text-xs">{item.label}</span>
                          <span className="text-[10px] text-gray-400 font-normal mt-1">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severidad / Consecuencia (C) */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      Severidad / Consecuencia (C) - Impacto potencial
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { val: 1, label: "Leve (1)", desc: "Primeros auxilios / Sin reposo" },
                        { val: 2, label: "Moderada (2)", desc: "Incapacidad temporal / CTP" },
                        { val: 4, label: "Grave (4)", desc: "Incapacidad permanente / Daño mayor" },
                        { val: 10, label: "Fatal / Crítico (10)", desc: "Muerte o invalidez total" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => updateActiveHazard({ sevValue: item.val })}
                          className={clsx(
                            "p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between",
                            activeHazard.sevValue === item.val
                              ? "bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20 font-bold"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <span className="text-xs">{item.label}</span>
                          <span className="text-[10px] text-gray-400 font-normal mt-1">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resultado VEP Calculado */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        Valor Esperado de Pérdida (VEP) = {activeHazard.probValue} × {activeHazard.sevValue} = {vepScore}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Clasificación inicial antes de aplicar medidas de control
                      </p>
                    </div>
                    <span
                      className={clsx(
                        "px-3 py-1 rounded-xl text-xs font-black border uppercase shadow-2xs",
                        getVepLevel(vepScore).color
                      )}
                    >
                      {getVepLevel(vepScore).label}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Protocolo MINSAL / ACHS Aplicado
                    </label>
                    <input
                      type="text"
                      value={activeHazard.protocolApplied}
                      onChange={(e) => updateActiveHazard({ protocolApplied: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              ETAPA 5: MEDIDAS DE CONTROL (UNO O MÁS CONTROLES POR RIESGO)
              ========================================================================= */}
          {currentStep === 5 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Medidas de Control Jerárquicas</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Establece uno o más controles preventivos y de ingeniería para mitigar el riesgo evaluado (DS 44).
                </p>
              </div>

              {/* Lista de Medidas de Control Registradas */}
              <div className="flex flex-col gap-2.5">
                {activeHazard.controlsList.map((ctrl, idx) => (
                  <div
                    key={ctrl.id}
                    className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-3.5 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {ctrl.type}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">Control #{idx + 1}</span>
                      </div>
                      <p className="text-xs text-gray-800 font-medium mt-1.5">{ctrl.description}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Responsable: {ctrl.responsible}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveControl(ctrl.id)}
                      className="text-gray-400 hover:text-red-600 p-1 transition cursor-pointer"
                      title="Eliminar control"
                    >
                      <LuTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Formulario para Agregar Nuevo Control */}
              {isAddingControl ? (
                <div className="bg-white border-2 border-teal-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                  <h4 className="text-xs font-bold text-teal-900">Nueva Medida de Control</h4>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Nivel en la Jerarquía de Control
                    </label>
                    <select
                      value={newControlType}
                      onChange={(e) => setNewControlType(e.target.value as TaskHazardData["controlsList"][0]["type"])}
                      className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2 text-xs text-gray-800 font-medium"
                    >
                      <option value="Eliminar / Sustituir">1. Eliminar / Sustituir</option>
                      <option value="Controles de Ingeniería">2. Controles de Ingeniería</option>
                      <option value="Controles Administrativos">3. Controles Administrativos / PTS</option>
                      <option value="Elementos de Protección Personal (EPP)">4. Elementos de Protección Personal (EPP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Descripción de la Medida
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej: Instalación de sensor de inclinación con alarma sonora y bloqueo automático..."
                      value={newControlDesc}
                      onChange={(e) => setNewControlDesc(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingControl(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddControl}
                      disabled={!newControlDesc.trim()}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-xs"
                    >
                      Guardar Control
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingControl(true)}
                  className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50/30 transition cursor-pointer"
                >
                  <LuPlus className="w-4 h-4" />
                  Agregar Medida de Control
                </button>
              )}
            </div>
          )}

          {/* =========================================================================
              ETAPA 6: REEVALUACIÓN DEL RIESGO RESIDUAL
              ========================================================================= */}
          {currentStep === 6 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Reevaluación del Riesgo Residual</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verifica la eficacia de las medidas de control calculando la probabilidad y severidad residual (DS 44).
                </p>
              </div>

              {/* Selector de Probabilidad Residual */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Probabilidad Residual (después de aplicar controles)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 1, label: "Baja (1)", desc: "Control eficaz" },
                    { val: 2, label: "Media (2)", desc: "Control parcial" },
                    { val: 4, label: "Alta (4)", desc: "Requiere revisión" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => updateActiveHazard({ residualProb: p.val })}
                      className={clsx(
                        "p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between",
                        activeHazard.residualProb === p.val
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 font-bold"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <span className="text-xs">{p.label}</span>
                      <span className="text-[10px] text-gray-400 font-normal mt-1">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Severidad Residual */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Severidad / Consecuencia Residual
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 1, label: "Leve (1)", desc: "Sin tiempo perdido" },
                    { val: 2, label: "Moderada (2)", desc: "Lesión menor" },
                    { val: 4, label: "Grave (4)", desc: "Lesión con tiempo perdido" },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => updateActiveHazard({ residualSev: s.val })}
                      className={clsx(
                        "p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between",
                        activeHazard.residualSev === s.val
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 font-bold"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <span className="text-xs">{s.label}</span>
                      <span className="text-[10px] text-gray-400 font-normal mt-1">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparativa Inicial vs Residual */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4.5 grid grid-cols-2 gap-4 text-center">
                <div className="border-r border-emerald-200/60 pr-2">
                  <p className="text-[11px] text-gray-500 font-medium">Riesgo Inicial (VEP)</p>
                  <p className="text-xl font-black text-gray-900 mt-0.5">{vepScore} pts</p>
                  <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-block mt-1">
                    {getVepLevel(vepScore).label}
                  </span>
                </div>

                <div className="pl-2">
                  <p className="text-[11px] text-gray-500 font-medium">Riesgo Residual Final</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">{residualScoreCalc} pts</p>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                    {residualScoreCalc <= 2 ? "Tolerable / Bajo" : "Moderado / Controlado"}
                  </span>
                </div>
              </div>

              {/* Resumen de Tareas Evaluadas */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
                <p className="font-bold text-gray-800 mb-1">
                  Resumen de confección ({tasks.length} tarea{tasks.length > 1 ? "s" : ""})
                </p>
                <p>
                  Al finalizar, se incorporarán todas las evaluaciones generadas a la matriz <strong>{matrix.code}</strong> en estado <em>En revisión</em>.
                </p>
              </div>
            </div>
          )}

          {/* Botones de Navegación del Wizard */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) setCurrentStep(currentStep - 1);
                else onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              <LuArrowLeft className="w-4 h-4" />
              {currentStep === 1 ? "Cancelar" : "Anterior"}
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Siguiente
                <LuArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishWizard}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#F04438] hover:bg-[#D92D20] rounded-xl shadow-sm transition cursor-pointer"
              >
                <LuCircleCheck className="w-4 h-4" />
                Finalizar e incorporar a la matriz
              </button>
            )}
          </div>
        </div>

        {/* Columna Derecha: Resumen en Vivo (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col gap-4 sticky top-[120px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                {matrix.code}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Etapa {currentStep} de 6</span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 mt-2 line-clamp-1">{matrix.name}</h4>
            <p className="text-[11px] text-gray-500 mt-0.5">{workArea}</p>
          </div>

          <div className="border-t border-gray-100 pt-3 flex flex-col gap-3 text-xs">
            <div>
              <span className="text-gray-400 text-[11px] font-medium block">Procesos Definidos:</span>
              <p className="font-bold text-gray-800">{processes.length} proceso(s)</p>
            </div>

            <div>
              <span className="text-gray-400 text-[11px] font-medium block">Tareas Registradas:</span>
              <p className="font-bold text-gray-800">{tasks.length} tarea(s)</p>
            </div>

            <div>
              <span className="text-gray-400 text-[11px] font-medium block">Tarea Activa:</span>
              <p className="font-semibold text-gray-900 line-clamp-2">{activeTask?.name}</p>
            </div>

            {activeHazard.hazardDescription && (
              <div>
                <span className="text-gray-400 text-[11px] font-medium block">Peligro Identificado:</span>
                <p className="text-gray-700 text-[11px] line-clamp-2 mt-0.5">{activeHazard.hazardDescription}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">VEP Inicial</span>
                <span className="text-base font-bold text-gray-900">{vepScore} pts</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-medium">Riesgo Residual</span>
                <span className="text-base font-bold text-emerald-600">{residualScoreCalc} pts</span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 text-[11px] font-medium block">
                Medidas de Control: {activeHazard.controlsList.length}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
