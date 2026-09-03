"use client";

import { useState, useMemo } from "react";
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
  LuBriefcase,
  LuTag,
  LuFlame,
  LuChevronDown,
  LuCircleAlert,
  LuLock,
} from "react-icons/lu";
import { IperMatrixItem } from "./IperMatrixView";
import { IperEvaluationRow } from "./IperMatrixDetailView";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import {
  getSectorRiskProfile,
  SectorHazardSuggestion,
} from "@/data/sectorRiskTemplates";

export interface ProcessItem {
  id: string;
  name: string;
  subprocesses: string[];
  workArea: string;
}

export interface JobPositionItem {
  id: string;
  name: string;
  headcountMen: number;
  headcountWomen: number;
  headcountDiversity: number;
  hasSensitivePeople?: boolean;
  hasDisabledPeople?: boolean;
}

export interface TaskItem {
  id: string;
  processId: string;
  processName: string;
  subprocessName?: string;
  name: string;
  taskType: "Rutinaria" | "No rutinaria";
  specificLocation?: string;
  positions: JobPositionItem[];
  // helper summaries
  jobPositions?: string;
  headcountMen?: number;
  headcountWomen?: number;
  headcountDiversity?: number;
}

export interface ControlItem {
  id: string;
  type: "Eliminar / Sustituir" | "Controles de Ingeniería" | "Controles Administrativos" | "Elementos de Protección Personal (EPP)";
  description: string;
  responsible: string;
}

export interface HazardItem {
  id: string;
  taskId: string;
  hazardDescription: string;
  specificRiskCode: string;
  specificRiskName: string;
  riskFamily: string;
  riskClassification: "Seguridad" | "Emergencias" | "Higiénicos" | "Psicosociales" | "Músculo-esquelético";
  genderDifferences: "Si" | "No";
  genderObservation: string;

  // Step 4 (Evaluación)
  // Para Seguridad / Emergencias (VEP: 1 Bajo, 2 Medio, 4 Alto):
  probValue: number; // 1, 2, 4
  sevValue: number;  // 1, 2, 4

  // Para Higiénicos, Psicosociales, Músculo-esqueléticos:
  protocolApplied: string;
  exposureMagnitude: string;
  riskLevelType: "Bajo" | "Medio" | "Alto" | string;

  // Step 5 (Controles)
  controlsList: ControlItem[];

  // Step 6 (Reevaluación)
  residualProb: number; // 1, 2, 4
  residualSev: number;  // 1, 2, 4
  residualRiskLevel?: "Bajo" | "Medio" | "Alto" | string;
  residualEfficacy?: string;
}

interface IperMatrixWizardProps {
  matrix: IperMatrixItem;
  onClose: () => void;
  onFinish: (newEvaluations: IperEvaluationRow | IperEvaluationRow[], updatedMatrix: IperMatrixItem) => void;
}

// Catálogos Normalizados de Riesgo según ACHS y DS 44
export const RISK_CATALOGS = {
  Seguridad: {
    families: [
      "Caídas a distinto nivel",
      "Caídas al mismo nivel",
      "Atrapamiento por o entre objetos",
      "Atropello o colisión con maquinaria",
      "Contacto con energía eléctrica",
      "Proyección de partículas o fragmentos",
      "Incendios y explosiones operativas",
      "Golpes por herramientas u objetos",
    ],
    risks: [
      { code: "B1", name: "Caída desde altura física (> 1.8m)", family: "Caídas a distinto nivel" },
      { code: "B2", name: "Caída de objetos / Carga suspendida", family: "Caídas a distinto nivel" },
      { code: "B3", name: "Contacto con partes móviles sin resguardo", family: "Atrapamiento por o entre objetos" },
      { code: "B4", name: "Atropello por vehículo o maquinaria en movimiento", family: "Atropello o colisión con maquinaria" },
      { code: "B5", name: "Contacto con conductores eléctricos energizados", family: "Contacto con energía eléctrica" },
      { code: "B6", name: "Golpe por herramientas o estructuras colapsadas", family: "Golpes por herramientas u objetos" },
      { code: "B7", name: "Caída al mismo nivel por tropiezo o resbalón", family: "Caídas al mismo nivel" },
      { code: "B8", name: "Proyección de esquirlas o partículas incandescentes", family: "Proyección de partículas o fragmentos" },
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
      { code: "E1", name: "Amago o incendio con atrapamiento de personal", family: "Incendio estructural o de faena" },
      { code: "E2", name: "Evacuación masiva por evento sísmico / tsunami", family: "Sismos y terremotos de alta intensidad" },
      { code: "E3", name: "Intoxicación masiva por derrame de químicos", family: "Fuga o derrame masivo de sustancias peligrosas" },
      { code: "E4", name: "Atrapamiento en zanjas o derrumbe de talud", family: "Colapso estructural / Derrumbe" },
    ],
  },
  Higiénicos: {
    families: [
      "Agentes físicos (Ruido, Vibraciones, Radiación)",
      "Agentes químicos (Polvo sílice, Solventes, Gases)",
      "Agentes biológicos (Hantavirus, COVID, Bacterias)",
    ],
    risks: [
      { code: "H1", name: "Exposición a Ruido Ocupacional (PREXOR)", family: "Agentes físicos (Ruido, Vibraciones, Radiación)" },
      { code: "H2", name: "Exposición a Sílice Libre Cristalizada (PLANESI)", family: "Agentes químicos (Polvo sílice, Solventes, Gases)" },
      { code: "H3", name: "Radiación Ultravioleta de Origen Solar (Guía UV)", family: "Agentes físicos (Ruido, Vibraciones, Radiación)" },
      { code: "H4", name: "Exposición a Vapores Orgánicos y Solventes", family: "Agentes químicos (Polvo sílice, Solventes, Gases)" },
      { code: "H5", name: "Exposición a Vibraciones de cuerpo entero o mano-brazo", family: "Agentes físicos (Ruido, Vibraciones, Radiación)" },
    ],
  },
  Psicosociales: {
    families: [
      "Organización y condiciones del trabajo",
      "Relaciones interpersonales y liderazgo",
      "Violencia en el trabajo y Ley Karin",
    ],
    risks: [
      { code: "PS1", name: "Carga de trabajo y exigencias cuantitativas elevadas", family: "Organización y condiciones del trabajo" },
      { code: "PS2", name: "Doble presencia e interferencia trabajo-familia", family: "Organización y condiciones del trabajo" },
      { code: "PS3", name: "Violencia laboral, acoso moral o sexual (Ley Karin)", family: "Violencia en el trabajo y Ley Karin" },
      { code: "PS4", name: "Falta de claridad de rol y escaso reconocimiento", family: "Relaciones interpersonales y liderazgo" },
    ],
  },
  "Músculo-esquelético": {
    families: [
      "Manejo manual de carga (MMC)",
      "Movimientos repetitivos extremidades superiores (TMERT)",
      "Posturas forzadas o mantenidas",
    ],
    risks: [
      { code: "ME1", name: "Manejo Manual de Cargas > 25 kg (Ley 20.001 / 20.949)", family: "Manejo manual de carga (MMC)" },
      { code: "ME2", name: "Trastornos Músculo-Esqueléticos EESS (TMERT-EESS)", family: "Movimientos repetitivos extremidades superiores (TMERT)" },
      { code: "ME3", name: "Postura bípeda o sedente prolongada > 4 horas", family: "Posturas forzadas o mantenidas" },
    ],
  },
};

// Protocolos sugeridos por categoría no cuantitativa
const PROTOCOL_SUGGESTIONS: Record<string, string[]> = {
  Higiénicos: ["PREXOR (Ruido)", "PLANESI (Sílice)", "Guía Técnica Radiación UV", "Protocolo Agentes Químicos", "Protocolo Vibraciones"],
  Psicosociales: ["Cuestionario CEAL-SM / SUSESO-ISTAS 21", "Protocolo Ley Karin (Acoso y Violencia)", "Programa de Apoyo Psicosocial ACHS"],
  "Músculo-esquelético": ["Norma Técnica TMERT-EESS", "Guía Técnica Manejo Manual de Cargas (MMC)", "Evaluación de Puestos de Trabajo Ergonómicos"],
};

export default function IperMatrixWizard({ matrix, onClose, onFinish }: IperMatrixWizardProps) {
  const { preferences, terminology } = useLifeOnPreferences();
  const sectorProfile = useMemo(() => {
    return getSectorRiskProfile(preferences.organizationSector);
  }, [preferences.organizationSector]);

  const [currentStep, setCurrentStep] = useState<number>(1);

  // 1. Estado de Área y Procesos (Campo libre sin precargar Centro de Trabajo)
  const [workArea, setWorkArea] = useState<string>("");
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [newProcessName, setNewProcessName] = useState("");
  const [newSubprocessInput, setNewSubprocessInput] = useState("");

  // 2. Estado de Tareas (Sin precargar datos ficticios)
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  // Formulario de Tarea en Etapa 2
  const [taskFormProcessId, setTaskFormProcessId] = useState("");
  const [taskFormSubprocess, setTaskFormSubprocess] = useState("");
  const [taskFormName, setTaskFormName] = useState("");
  const [taskFormType, setTaskFormType] = useState<"Rutinaria" | "No rutinaria">("Rutinaria");
  const [taskFormLocation, setTaskFormLocation] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Sub-formulario para puestos individuales dentro de la tarea (Cargo > Dotación + Opciones marcables)
  const [taskFormPositionsList, setTaskFormPositionsList] = useState<JobPositionItem[]>([]);
  const [posFormName, setPosFormName] = useState("");
  const [posFormMen, setPosFormMen] = useState(1);
  const [posFormWomen, setPosFormWomen] = useState(0);
  const [posFormDiv, setPosFormDiv] = useState(0);
  const [posFormSensitive, setPosFormSensitive] = useState(false);
  const [posFormDisabled, setPosFormDisabled] = useState(false);

  // 3. Estado de Peligros y Riesgos (Sin precargar datos ficticios)
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedHazardId, setSelectedHazardId] = useState<string>("");
  const [hazards, setHazards] = useState<HazardItem[]>([]);

  // Formulario para Agregar Nuevo Peligro en Etapa 3
  const [hazardFormDesc, setHazardFormDesc] = useState("");
  const [hazardFormCode, setHazardFormCode] = useState("B1");
  const [hazardFormName, setHazardFormName] = useState("Caída desde altura física (> 1.8m)");
  const [hazardFormFamily, setHazardFormFamily] = useState("Caídas a distinto nivel");
  const [hazardFormClass, setHazardFormClass] = useState<HazardItem["riskClassification"]>("Seguridad");
  const [hazardFormGenderDiff, setHazardFormGenderDiff] = useState<"Si" | "No">("No");
  const [hazardFormGenderObs, setHazardFormGenderObs] = useState("");

  // Estado para agregar control en Etapa 5
  const [newControlType, setNewControlType] = useState<ControlItem["type"]>("Controles de Ingeniería");
  const [newControlDesc, setNewControlDesc] = useState("");
  const [isAddingControl, setIsAddingControl] = useState(false);

  // Tarea activa seleccionada
  const activeTask = useMemo(() => {
    if (tasks.length === 0) return null;
    return tasks.find((t) => t.id === selectedTaskId) || tasks[0];
  }, [tasks, selectedTaskId]);

  // Peligros correspondientes a la tarea activa
  const taskHazards = useMemo(() => {
    if (!activeTask) return [];
    return hazards.filter((h) => h.taskId === activeTask.id);
  }, [hazards, activeTask]);

  // Peligro activo seleccionado para evaluación / controles / reevaluación
  const activeHazard = useMemo(() => {
    if (!activeTask || hazards.length === 0) return null;
    const found = hazards.find((h) => h.id === selectedHazardId && h.taskId === activeTask.id);
    if (found) return found;
    if (taskHazards.length > 0) return taskHazards[0];
    return hazards[0] || null;
  }, [hazards, selectedHazardId, activeTask, taskHazards]);

  // Actualizar un peligro existente
  const updateHazardItem = (hazardId: string, updates: Partial<HazardItem>) => {
    setHazards((prev) =>
      prev.map((h) => (h.id === hazardId ? { ...h, ...updates } : h))
    );
  };

  // Handler para incorporar un peligro propuesto del rubro directamente a la tarea activa
  const handleAddSectorHazardToTask = (sug: SectorHazardSuggestion) => {
    if (!activeTask) return;

    const newHazard: HazardItem = {
      id: `haz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId: activeTask.id,
      hazardDescription: sug.hazardDescription,
      specificRiskCode: sug.specificRiskCode,
      specificRiskName: sug.specificRiskName,
      riskFamily: sug.riskFamily,
      riskClassification: sug.riskClassification,
      genderDifferences: "No",
      genderObservation: "",
      probValue: preferences.riskEvaluationMethod === "matrix5x5" ? sug.prob5x5 : sug.defaultProb,
      sevValue: preferences.riskEvaluationMethod === "matrix5x5" ? sug.sev5x5 : sug.defaultSev,
      protocolApplied:
        sug.riskClassification === "Seguridad" || sug.riskClassification === "Emergencias"
          ? "DS 44"
          : PROTOCOL_SUGGESTIONS[sug.riskClassification]?.[0] || "Norma Técnica",
      exposureMagnitude: "Jornada laboral estándar",
      riskLevelType: sug.defaultSev === 4 ? "Alto" : "Medio",
      controlsList: sug.recommendedControls.map((c, idx) => ({
        id: `c-rec-${Date.now()}-${idx}`,
        type: c.type,
        description: c.description,
        responsible: matrix.responsible || "Prevencionista de Riesgos",
      })),
      residualProb: 1,
      residualSev: sug.defaultSev === 4 ? 2 : 1,
      residualRiskLevel: "Bajo",
    };

    setHazards((prev) => [...prev, newHazard]);
    setSelectedHazardId(newHazard.id);
  };

  // Cargar en masa los riesgos recomendados del rubro a la tarea activa
  const handleLoadAllSectorHazards = () => {
    if (!activeTask) return;

    const newHazardsToAdd: HazardItem[] = [];
    sectorProfile.suggestedHazards.forEach((sug, idx) => {
      const alreadyExists = hazards.some(
        (h) =>
          h.taskId === activeTask.id &&
          (h.specificRiskCode === sug.specificRiskCode || h.hazardDescription === sug.hazardDescription)
      );
      if (!alreadyExists) {
        newHazardsToAdd.push({
          id: `haz-bulk-${Date.now()}-${idx}`,
          taskId: activeTask.id,
          hazardDescription: sug.hazardDescription,
          specificRiskCode: sug.specificRiskCode,
          specificRiskName: sug.specificRiskName,
          riskFamily: sug.riskFamily,
          riskClassification: sug.riskClassification,
          genderDifferences: "No",
          genderObservation: "",
          probValue: preferences.riskEvaluationMethod === "matrix5x5" ? sug.prob5x5 : sug.defaultProb,
          sevValue: preferences.riskEvaluationMethod === "matrix5x5" ? sug.sev5x5 : sug.defaultSev,
          protocolApplied:
            sug.riskClassification === "Seguridad" || sug.riskClassification === "Emergencias"
              ? "DS 44"
              : PROTOCOL_SUGGESTIONS[sug.riskClassification]?.[0] || "Norma Técnica",
          exposureMagnitude: "Jornada laboral estándar",
          riskLevelType: sug.defaultSev === 4 ? "Alto" : "Medio",
          controlsList: sug.recommendedControls.map((c, cIdx) => ({
            id: `c-rec-${Date.now()}-${idx}-${cIdx}`,
            type: c.type,
            description: c.description,
            responsible: matrix.responsible || "Prevencionista de Riesgos",
          })),
          residualProb: 1,
          residualSev: sug.defaultSev === 4 ? 2 : 1,
          residualRiskLevel: "Bajo",
        });
      }
    });

    if (newHazardsToAdd.length > 0) {
      setHazards((prev) => [...prev, ...newHazardsToAdd]);
      setSelectedHazardId(newHazardsToAdd[0].id);
    }
  };

  // Validación estricta por etapa para impedir avanzar si falta información
  const stepValidation = useMemo(() => {
    // Etapa 1: Área no vacía y al menos 1 proceso
    const step1Valid = workArea.trim().length > 0 && processes.length > 0;
    const step1Error = !workArea.trim()
      ? "Debes ingresar el Área de Trabajo para continuar."
      : processes.length === 0
        ? "Debes agregar al menos un proceso a la matriz."
        : null;

    // Etapa 2: Al menos 1 tarea y todas las tareas con al menos 1 puesto
    const step2Valid =
      tasks.length > 0 && tasks.every((t) => t.positions && t.positions.length > 0);
    const step2Error =
      tasks.length === 0
        ? "Debes registrar al menos una tarea en la matriz."
        : !tasks.every((t) => t.positions && t.positions.length > 0)
          ? "Cada tarea debe tener al menos un puesto de trabajo asignado con su dotación."
          : null;

    // Etapa 3: Al menos 1 peligro y cada tarea con al menos 1 peligro asignado
    const step3Valid =
      hazards.length > 0 && tasks.every((t) => hazards.some((h) => h.taskId === t.id));
    const step3Error =
      hazards.length === 0
        ? "Debes identificar al menos un peligro con su riesgo asociado."
        : !tasks.every((t) => hazards.some((h) => h.taskId === t.id))
          ? "Todas las tareas registradas deben tener al menos un peligro asignado."
          : null;

    // Etapa 4: Todos los peligros deben estar evaluados
    const step4Valid =
      hazards.length > 0 &&
      hazards.every((h) => {
        const isSafety = h.riskClassification === "Seguridad" || h.riskClassification === "Emergencias";
        if (isSafety) {
          return h.probValue > 0 && h.sevValue > 0;
        }
        return (
          (h.protocolApplied || "").trim().length > 0 &&
          (h.exposureMagnitude || "").trim().length > 0 &&
          (h.riskLevelType || "").trim().length > 0
        );
      });
    const step4Error = !step4Valid
      ? "Debes completar la evaluación inicial de todos los peligros registrados."
      : null;

    // Etapa 5: Todos los peligros deben tener al menos una medida de control
    const step5Valid =
      hazards.length > 0 &&
      hazards.every((h) => h.controlsList && h.controlsList.length > 0);
    const step5Error = !step5Valid
      ? "Todos los peligros deben tener al menos una medida de control registrada bajo la jerarquía preventiva."
      : null;

    // Etapa 6: Reevaluación completada y residual menor o igual a inicial
    const step6Valid =
      hazards.length > 0 &&
      hazards.every((h) => {
        const isSafety = h.riskClassification === "Seguridad" || h.riskClassification === "Emergencias";
        if (isSafety) {
          return h.residualProb <= h.probValue && h.residualSev <= h.sevValue;
        }
        return !!h.residualRiskLevel;
      });
    const step6Error = !step6Valid
      ? "Debes completar la reevaluación del riesgo residual (el cual debe ser menor o igual al inicial)."
      : null;

    const map: Record<number, { isValid: boolean; errorMsg: string | null }> = {
      1: { isValid: step1Valid, errorMsg: step1Error },
      2: { isValid: step2Valid, errorMsg: step2Error },
      3: { isValid: step3Valid, errorMsg: step3Error },
      4: { isValid: step4Valid, errorMsg: step4Error },
      5: { isValid: step5Valid, errorMsg: step5Error },
      6: { isValid: step6Valid, errorMsg: step6Error },
    };

    return map;
  }, [workArea, processes, tasks, hazards]);

  const canAdvanceCurrentStep = stepValidation[currentStep]?.isValid ?? false;
  const currentStepError = stepValidation[currentStep]?.errorMsg;

  // Manejador de navegación segura entre etapas
  const handleStepNavigation = (targetStep: number) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    let allValid = true;
    for (let s = 1; s < targetStep; s++) {
      if (!stepValidation[s]?.isValid) {
        allValid = false;
        break;
      }
    }
    if (allValid) {
      setCurrentStep(targetStep);
    }
  };

  // Cálculo VEP para Seguridad / Emergencias: P (1, 2, 4) * C (1, 2, 4)
  const isSafetyOrEmergency = activeHazard
    ? activeHazard.riskClassification === "Seguridad" || activeHazard.riskClassification === "Emergencias"
    : true;

  const vepScore = activeHazard ? activeHazard.probValue * activeHazard.sevValue : 0;
  const getVepLevel = (score: number) => {
    if (score >= 16) return { label: "Crítico / Intolerable", color: "text-red-700 bg-red-50 border-red-200" };
    if (score >= 8) return { label: "Alto / Importante", color: "text-orange-700 bg-orange-50 border-orange-200" };
    if (score >= 4) return { label: "Medio / Moderado", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "Bajo / Tolerable", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  };

  const residualScoreCalc = activeHazard ? activeHazard.residualProb * activeHazard.residualSev : 0;

  // =========================================================================
  // HANDLERS: ETAPA 1 (PROCESOS Y SUBPROCESOS)
  // =========================================================================
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
    const updatedProcs = [...processes, newProc];
    setProcesses(updatedProcs);
    if (!taskFormProcessId) {
      setTaskFormProcessId(newProc.id);
    }
    setNewProcessName("");
    setNewSubprocessInput("");
  };

  const handleRemoveSubprocessFromProc = (procId: string, subIndex: number) => {
    setProcesses(
      processes.map((p) =>
        p.id === procId ? { ...p, subprocesses: p.subprocesses.filter((_, idx) => idx !== subIndex) } : p
      )
    );
  };

  const handleRemoveProcess = (id: string) => {
    setProcesses(processes.filter((p) => p.id !== id));
  };

  // =========================================================================
  // HANDLERS: ETAPA 2 (TAREAS Y PUESTOS INDIVIDUALES: CARGO > DOTACIÓN)
  // =========================================================================
  const handleAddPositionToTaskForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posFormName.trim()) return;

    const newPos: JobPositionItem = {
      id: `pos-${Date.now()}`,
      name: posFormName.trim(),
      headcountMen: posFormMen,
      headcountWomen: posFormWomen,
      headcountDiversity: posFormDiv,
      hasSensitivePeople: posFormSensitive,
      hasDisabledPeople: posFormDisabled,
    };

    setTaskFormPositionsList([...taskFormPositionsList, newPos]);
    setPosFormName("");
    setPosFormMen(1);
    setPosFormWomen(0);
    setPosFormDiv(0);
    setPosFormSensitive(false);
    setPosFormDisabled(false);
  };

  const handleRemovePositionFromTaskForm = (posId: string) => {
    setTaskFormPositionsList(taskFormPositionsList.filter((p) => p.id !== posId));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormName.trim() || processes.length === 0) return;
    const selectedProc = processes.find((p) => p.id === taskFormProcessId) || processes[0];

    const finalPositions = taskFormPositionsList.length > 0 ? taskFormPositionsList : [
      {
        id: `pos-${Date.now()}`,
        name: "Operador de faena",
        headcountMen: 1,
        headcountWomen: 0,
        headcountDiversity: 0,
      },
    ];

    const totalMen = finalPositions.reduce((acc, p) => acc + p.headcountMen, 0);
    const totalWomen = finalPositions.reduce((acc, p) => acc + p.headcountWomen, 0);
    const totalDiv = finalPositions.reduce((acc, p) => acc + p.headcountDiversity, 0);
    const posSummary = finalPositions.map((p) => `${p.name} (${p.headcountMen + p.headcountWomen + p.headcountDiversity})`).join(", ");

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      processId: selectedProc.id,
      processName: selectedProc.name,
      subprocessName: taskFormSubprocess.trim() || undefined,
      name: taskFormName.trim(),
      taskType: taskFormType,
      specificLocation: taskFormLocation.trim() || undefined,
      positions: finalPositions,
      jobPositions: posSummary,
      headcountMen: totalMen,
      headcountWomen: totalWomen,
      headcountDiversity: totalDiv,
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setExpandedTaskId(newTask.id);

    if (!selectedTaskId) {
      setSelectedTaskId(newTask.id);
    }

    setTaskFormName("");
    setTaskFormLocation("");
    setTaskFormPositionsList([]);
  };

  const handleRemoveTask = (id: string) => {
    const remaining = tasks.filter((t) => t.id !== id);
    setTasks(remaining);
    setHazards((prev) => prev.filter((h) => h.taskId !== id));
    if (selectedTaskId === id) {
      setSelectedTaskId(remaining.length > 0 ? remaining[0].id : "");
    }
  };

  // =========================================================================
  // HANDLERS: ETAPA 3 (PELIGROS Y RIESGOS ASOCIADOS)
  // =========================================================================
  const handleAddHazardToSelectedTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hazardFormDesc.trim() || !activeTask) return;

    const newHazard: HazardItem = {
      id: `haz-${Date.now()}`,
      taskId: activeTask.id,
      hazardDescription: hazardFormDesc.trim(),
      specificRiskCode: hazardFormCode,
      specificRiskName: hazardFormName,
      riskFamily: hazardFormFamily,
      riskClassification: hazardFormClass,
      genderDifferences: hazardFormGenderDiff,
      genderObservation: hazardFormGenderObs.trim(),
      probValue: 2,
      sevValue: 4,
      protocolApplied: hazardFormClass === "Seguridad" || hazardFormClass === "Emergencias" ? "DS 44" : PROTOCOL_SUGGESTIONS[hazardFormClass]?.[0] || "Norma Técnica",
      exposureMagnitude: "Jornada laboral estándar",
      riskLevelType: "Medio",
      controlsList: [],
      residualProb: 1,
      residualSev: 2,
      residualRiskLevel: "Bajo",
    };

    const updatedHazards = [...hazards, newHazard];
    setHazards(updatedHazards);
    setSelectedHazardId(newHazard.id);
    setHazardFormDesc("");
    setHazardFormGenderObs("");
  };

  const handleRemoveHazard = (hazardId: string) => {
    const remaining = hazards.filter((h) => h.id !== hazardId);
    setHazards(remaining);
    if (selectedHazardId === hazardId) {
      setSelectedHazardId(remaining.length > 0 ? remaining[0].id : "");
    }
  };

  // =========================================================================
  // HANDLERS: ETAPA 5 (MEDIDAS DE CONTROL)
  // =========================================================================
  const handleAddControl = () => {
    if (!newControlDesc.trim() || !activeHazard) return;
    const newControlItem: ControlItem = {
      id: `c-${Date.now()}`,
      type: newControlType,
      description: newControlDesc.trim(),
      responsible: matrix.responsible || "Prevencionista de Riesgos",
    };
    updateHazardItem(activeHazard.id, {
      controlsList: [...activeHazard.controlsList, newControlItem],
    });
    setNewControlDesc("");
    setIsAddingControl(false);
  };

  const handleRemoveControl = (ctrlId: string) => {
    if (!activeHazard) return;
    updateHazardItem(activeHazard.id, {
      controlsList: activeHazard.controlsList.filter((c) => c.id !== ctrlId),
    });
  };

  // =========================================================================
  // FINALIZAR Y GUARDAR MATRIZ
  // =========================================================================
  const handleFinishWizard = () => {
    const generatedEvaluations: IperEvaluationRow[] = [];

    tasks.forEach((task) => {
      const taskHazardsList = hazards.filter((h) => h.taskId === task.id);

      taskHazardsList.forEach((hItem, idx) => {
        const isSafety = hItem.riskClassification === "Seguridad" || hItem.riskClassification === "Emergencias";
        const initialScore = isSafety ? hItem.probValue * hItem.sevValue : hItem.riskLevelType === "Alto" ? 8 : hItem.riskLevelType === "Medio" ? 4 : 2;
        const residualScore = isSafety ? hItem.residualProb * hItem.residualSev : hItem.residualRiskLevel === "Alto" ? 4 : 1;

        const initialLvl: "Crítico" | "Alto" | "Medio" | "Bajo" = isSafety
          ? initialScore >= 16
            ? "Crítico"
            : initialScore >= 8
              ? "Alto"
              : initialScore >= 4
                ? "Medio"
                : "Bajo"
          : hItem.riskLevelType === "Alto"
            ? "Alto"
            : hItem.riskLevelType === "Medio"
              ? "Medio"
              : "Bajo";

        const residualLvl: "Crítico" | "Alto" | "Medio" | "Bajo" = isSafety
          ? residualScore >= 8
            ? "Medio"
            : "Bajo"
          : (hItem.residualRiskLevel as any) || "Bajo";

        const row: IperEvaluationRow = {
          id: `EV-${Date.now().toString().slice(-4)}-${task.id.slice(-3)}-${idx + 1}`,
          process: task.processName,
          task: task.name,
          hazard: hItem.hazardDescription || hItem.specificRiskName,
          riskEvent: `[${hItem.specificRiskCode}] ${hItem.specificRiskName} (${hItem.riskClassification})`,
          probInitial: hItem.probValue,
          sevInitial: hItem.sevValue,
          riskInitial: initialScore,
          initialLevel: initialLvl,
          controls: hItem.controlsList.length > 0
            ? hItem.controlsList.map((c) => `[${c.type}] ${c.description}`).join(" • ")
            : "Procedimiento de Trabajo Seguro y supervisión operacional",
          probResidual: hItem.residualProb,
          sevResidual: hItem.residualSev,
          riskResidual: residualScore,
          residualLevel: residualLvl,
          controlStatus: "Implementado",
          responsible: matrix.responsible,
        };

        generatedEvaluations.push(row);
      });
    });

    const updatedMatrix: IperMatrixItem = {
      ...matrix,
      status: "En revisión",
      totalRecords:
        typeof matrix.totalRecords === "number"
          ? matrix.totalRecords + generatedEvaluations.length
          : generatedEvaluations.length,
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
      {/* 1. Header Superior y Barra de Progreso FIJA */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-2xs flex-shrink-0">
        <header className="py-3 px-4 sm:px-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-[#F04438] tracking-tight">Life</span>
              <span className="text-lg font-black text-[#0D9488] tracking-tight">On</span>
            </div>
            <div className="h-4 w-px bg-gray-300 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-700 hidden sm:inline">
                Confección de Matriz IPER &bull; <span className="text-teal-700 font-bold">{matrix.code}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {preferences.riskEvaluationMethod === "ds44"
                  ? "DS 44 / ISL"
                  : preferences.riskEvaluationMethod === "matrix5x5"
                  ? "Matriz 5×5"
                  : "Estándar"}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Rubro: {sectorProfile.sector}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {preferences.experienceLevel === "expert"
                  ? "Especialista"
                  : preferences.experienceLevel === "intermediate"
                  ? "Técnico"
                  : "Guiado"}
              </span>
            </div>
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

        {/* Barra de Progreso / Stepper FIJA */}
        <div className="py-2.5 px-3 sm:px-6 overflow-x-auto scrollbar-none">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-1 sm:gap-2 min-w-[320px] sm:min-w-0">
            {stepsHeader.map((step, idx) => {
              const isCompleted = step.num < currentStep && stepValidation[step.num]?.isValid;
              const isCurrent = step.num === currentStep;

              return (
                <div key={step.num} className="flex items-center gap-1 sm:gap-2 flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => handleStepNavigation(step.num)}
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
                        step.num < currentStep && stepValidation[step.num]?.isValid ? "bg-teal-500" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
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

              {/* Sugerencias de Procesos habituales según el Rubro (ej: Minería) */}
              <div className="bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-blue-50/40 border border-teal-200/80 rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs">
                    <LuSparkles className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-teal-950">
                      Procesos habituales en tu rubro: <span className="text-teal-700 font-extrabold">{sectorProfile.sector}</span>
                    </h4>
                    <p className="text-[11px] text-teal-800">
                      Carga procesos estándar de la industria y sus subprocesos con un solo clic:
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {sectorProfile.recommendedProcesses.map((recProc, rIdx) => {
                    const isAlreadyAdded = processes.some(
                      (p) => p.name.toLowerCase() === recProc.name.toLowerCase()
                    );
                    return (
                      <button
                        key={rIdx}
                        type="button"
                        onClick={() => {
                          if (!workArea) setWorkArea(recProc.workArea);
                          if (!isAlreadyAdded) {
                            const newP: ProcessItem = {
                              id: `proc-rec-${Date.now()}-${rIdx}`,
                              name: recProc.name,
                              subprocesses: [...recProc.subprocesses],
                              workArea: workArea || recProc.workArea,
                            };
                            setProcesses((prev) => [...prev, newP]);
                            if (!taskFormProcessId) setTaskFormProcessId(newP.id);
                          }
                        }}
                        disabled={isAlreadyAdded}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer",
                          isAlreadyAdded
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300 opacity-80 cursor-default"
                            : "bg-white hover:bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs"
                        )}
                      >
                        {isAlreadyAdded ? (
                          <LuCheck className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <LuPlus className="w-3.5 h-3.5 text-teal-600" />
                        )}
                        <span>{recProc.name}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          ({recProc.subprocesses.length} subs)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Área de Trabajo */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Área de Trabajo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Bodega Central, Maestranza, Sector Chancado, Área de Envasado..."
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
                {processes.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500">
                    Aún no se han agregado procesos. Ingresa el nombre del primer proceso arriba para comenzar.
                  </div>
                ) : (
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
                              {proc.workArea && <p className="text-[10px] text-gray-400">Área: {proc.workArea}</p>}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveProcess(proc.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Eliminar proceso"
                          >
                            <LuTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Chips de Subprocesos */}
                        <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-gray-400 font-medium mr-1">Subprocesos:</span>
                          {proc.subprocesses.length === 0 ? (
                            <span className="text-[11px] text-gray-400 italic">Sin subprocesos (asignación directa al proceso)</span>
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
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              ETAPA 2: TAREAS (TIPO AL LADO DEL NOMBRE Y PUESTOS CON CARGO > DOTACIÓN)
              ========================================================================= */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                    <LuLayers className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Tareas y Puestos de Trabajo</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Registra las tareas con su tipo (*Rutinaria* / *No rutinaria*) e incorpora los cargos o puestos de a uno con su dotación.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sugerencias de Tareas para el Rubro */}
              {processes.length > 0 && sectorProfile.recommendedTasks.length > 0 && (
                <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-950">
                    <LuSparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Tareas habituales en {sectorProfile.sector}:</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {sectorProfile.recommendedTasks.map((recTask, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => {
                          setTaskFormName(recTask.taskName);
                          setTaskFormType(recTask.taskType);
                          setTaskFormLocation(recTask.location);
                          if (recTask.defaultPositions) {
                            setTaskFormPositionsList(
                              recTask.defaultPositions.map((pos, pIdx) => ({
                                id: `pos-rec-${Date.now()}-${pIdx}`,
                                name: pos.name,
                                headcountMen: pos.headcountMen,
                                headcountWomen: pos.headcountWomen,
                                headcountDiversity: 0,
                              }))
                            );
                          }
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-teal-100/70 text-teal-900 text-[11px] font-medium rounded-lg border border-teal-200 shadow-2xs transition cursor-pointer text-left"
                      >
                        + {recTask.taskName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {processes.length === 0 ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center flex flex-col items-center gap-2">
                  <LuTriangleAlert className="w-6 h-6 text-amber-600" />
                  <p className="text-xs font-bold text-amber-900">Primero debes agregar al menos un proceso en la Etapa 1</p>
                  <p className="text-[11px] text-amber-700">Regresa a la etapa anterior para registrar los procesos del centro de trabajo.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="mt-2 px-4 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition"
                  >
                    Ir a Etapa 1 (Área y Procesos)
                  </button>
                </div>
              ) : (
                <>
                  {/* Formulario de Nueva Tarea */}
                  <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-4 flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <LuPlus className="w-3.5 h-3.5 text-teal-600" />
                      Registrar Nueva Tarea
                    </h4>

                    {/* 1. Proceso Perteneciente y Subproceso */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                          Proceso Perteneciente
                        </label>
                        <select
                          value={taskFormProcessId || processes[0]?.id}
                          onChange={(e) => {
                            setTaskFormProcessId(e.target.value);
                            const selectedP = processes.find((p) => p.id === e.target.value);
                            if (selectedP && selectedP.subprocesses.length > 0) {
                              setTaskFormSubprocess(selectedP.subprocesses[0]);
                            } else {
                              setTaskFormSubprocess("");
                            }
                          }}
                          className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                        >
                          {processes.map((proc) => (
                            <option key={proc.id} value={proc.id}>
                              {proc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(() => {
                        const selP = processes.find((p) => p.id === (taskFormProcessId || processes[0]?.id)) || processes[0];
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
                    </div>

                    {/* 2. Nombre de la Tarea y Tipo de Tarea (UNO AL LADO DEL OTRO) */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-8">
                        <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                          Nombre de la Tarea Específica
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Montaje de andamios tubulares en fachada / Izaje de vigas metálicas"
                          value={taskFormName}
                          onChange={(e) => setTaskFormName(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                          Tipo de Tarea
                        </label>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1.5">
                          <button
                            type="button"
                            onClick={() => setTaskFormType("Rutinaria")}
                            className={clsx(
                              "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition cursor-pointer text-center",
                              taskFormType === "Rutinaria"
                                ? "bg-teal-600 text-white shadow-2xs"
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            Rutinaria
                          </button>
                          <button
                            type="button"
                            onClick={() => setTaskFormType("No rutinaria")}
                            className={clsx(
                              "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition cursor-pointer text-center",
                              taskFormType === "No rutinaria"
                                ? "bg-amber-600 text-white shadow-2xs"
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            No rutinaria
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lugar específico donde se realiza la tarea */}
                    <div>
                      <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                        Lugar Específico donde se Realiza la Tarea
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Nivel +120 sector tolvas / Techumbre nave 3 / Galpón de maestranza / Línea de producción 2"
                        value={taskFormLocation}
                        onChange={(e) => setTaskFormLocation(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                      />
                    </div>

                    {/* 3. Sub-formulario: Ingreso de Puestos de a uno (Cargo o Puesto > Dotación) */}
                    <div className="bg-white border border-teal-100 rounded-2xl p-3.5 flex flex-col gap-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                          <LuBriefcase className="w-3.5 h-3.5 text-teal-600" />
                          + Ingresar Puesto o Cargo (de a uno)
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Cargo o Puesto &gt; Dotación
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-6">
                          <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                            Cargo o Puesto
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: Operador de Grúa, Rigger, Soldador"
                            value={posFormName}
                            onChange={(e) => setPosFormName(e.target.value)}
                            className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                            Dotación
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center bg-[#F8FAFC] border border-gray-200 rounded-xl px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                value={posFormMen}
                                onChange={(e) => setPosFormMen(Number(e.target.value))}
                                className="w-8 bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                              />
                              <span className="text-[10px] text-gray-500 ml-auto font-medium">♂ Hombres</span>
                            </div>
                            <div className="flex items-center bg-[#F8FAFC] border border-gray-200 rounded-xl px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                value={posFormWomen}
                                onChange={(e) => setPosFormWomen(Number(e.target.value))}
                                className="w-8 bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                              />
                              <span className="text-[10px] text-gray-500 ml-auto font-medium">♀ Mujeres</span>
                            </div>
                            <div className="flex items-center bg-[#F8FAFC] border border-gray-200 rounded-xl px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                value={posFormDiv}
                                onChange={(e) => setPosFormDiv(Number(e.target.value))}
                                className="w-8 bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                              />
                              <span className="text-[10px] text-gray-500 ml-auto font-medium">⚥ Div</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Opciones marcables: Sensibilidad y Discapacidad */}
                      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-gray-700">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={posFormSensitive}
                              onChange={(e) => setPosFormSensitive(e.target.checked)}
                              className="accent-teal-600 w-3.5 h-3.5"
                            />
                            <span className="text-[11px] font-medium">Personas especialmente sensibles</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={posFormDisabled}
                              onChange={(e) => setPosFormDisabled(e.target.checked)}
                              className="accent-teal-600 w-3.5 h-3.5"
                            />
                            <span className="text-[11px] font-medium">Personas con discapacidad</span>
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddPositionToTaskForm}
                          disabled={!posFormName.trim()}
                          className="px-3.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition cursor-pointer disabled:opacity-40"
                        >
                          + Agregar este Puesto
                        </button>
                      </div>

                      {/* Lista de Puestos agregados para esta tarea */}
                      {taskFormPositionsList.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Puestos agregados para esta tarea ({taskFormPositionsList.length}):
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {taskFormPositionsList.map((pos) => (
                              <div
                                key={pos.id}
                                className="bg-gray-50 rounded-xl p-2 px-3 flex items-center justify-between gap-2 text-xs border border-gray-200"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-800">{pos.name}</span>
                                  <span className="text-[11px] text-gray-500 font-mono">
                                    (Dotación: {pos.headcountMen} ♂, {pos.headcountWomen} ♀, {pos.headcountDiversity} ⚥)
                                  </span>
                                  {pos.hasSensitivePeople && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                                      Sensible
                                    </span>
                                  )}
                                  {pos.hasDisabledPeople && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                                      Discapacidad
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePositionFromTaskForm(pos.id)}
                                  className="text-gray-400 hover:text-red-600 cursor-pointer p-1"
                                >
                                  <LuTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

                  {/* Lista de Tareas Incorporadas (Acordeón / Colapsable) */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 mb-2">
                      Tareas Incorporadas a la Matriz ({tasks.length})
                    </h4>
                    {tasks.length === 0 ? (
                      <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500">
                        Aún no se han agregado tareas. Completa el formulario arriba para agregar la primera tarea.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {tasks.map((task, idx) => {
                          const isExpanded = expandedTaskId === task.id;
                          const totalHeadcount = (task.headcountMen || 0) + (task.headcountWomen || 0) + (task.headcountDiversity || 0);

                          return (
                            <div
                              key={task.id}
                              className={clsx(
                                "bg-white border rounded-2xl transition shadow-2xs overflow-hidden",
                                isExpanded ? "border-teal-300 ring-2 ring-teal-500/10" : "border-gray-200 hover:border-gray-300"
                              )}
                            >
                              {/* Header general de la tarjeta de tarea (Click para colapsar/expandir) */}
                              <div
                                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-gray-50/50 transition select-none"
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-gray-900">{task.name}</span>
                                      <span
                                        className={clsx(
                                          "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                                          task.taskType === "Rutinaria"
                                            ? "bg-teal-50 text-teal-800 border-teal-200"
                                            : "bg-amber-50 text-amber-800 border-amber-200"
                                        )}
                                      >
                                        {task.taskType}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1 flex-wrap">
                                      <span>
                                        Proceso: <strong className="text-gray-700">{task.processName}</strong>
                                        {task.subprocessName ? ` ➔ ${task.subprocessName}` : ""}
                                      </span>
                                      {task.specificLocation && (
                                        <>
                                          <span>&bull;</span>
                                          <span className="text-teal-800 font-medium">📍 {task.specificLocation}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                                    {task.positions?.length || 0} Puesto(s) &bull; {totalHeadcount} pers.
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveTask(task.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                    title="Eliminar tarea"
                                  >
                                    <LuTrash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <span className="p-1 text-gray-400">
                                    <LuChevronDown className={clsx("w-4 h-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                                  </span>
                                </div>
                              </div>

                              {/* Sección Expandible: Detalle de Puestos */}
                              {isExpanded && (
                                <div className="p-4 pt-0 border-t border-gray-100 mt-1 bg-gray-50/40">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2 pt-3">
                                    Detalle de Puestos y Dotación ({task.positions?.length || 0}):
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {task.positions?.map((pos) => (
                                      <div
                                        key={pos.id}
                                        className="bg-white rounded-xl p-2.5 border border-gray-200 text-[11px] flex items-center justify-between flex-wrap gap-1 shadow-2xs"
                                      >
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-bold text-gray-800">{pos.name}</span>
                                          {pos.hasSensitivePeople && (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                                              Sensible
                                            </span>
                                          )}
                                          {pos.hasDisabledPeople && (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                                              Discapacidad
                                            </span>
                                          )}
                                        </div>
                                        <span className="font-mono text-[10px] text-gray-500 font-semibold">
                                          {pos.headcountMen}♂ {pos.headcountWomen}♀ {pos.headcountDiversity}⚥
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* =========================================================================
              ETAPA 3: PELIGROS (SELECTOR DESPLEGABLE, MÚLTIPLES PELIGROS Y ORDEN DE CAMPOS)
              ========================================================================= */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <LuShieldAlert className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Identificación de Peligros y Riesgos</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Selecciona la tarea a analizar mediante el selector desplegable e incorpora uno o más peligros con su riesgo asociado (Anexo C - DS 44).
                    </p>
                  </div>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center flex flex-col items-center gap-2">
                  <LuTriangleAlert className="w-6 h-6 text-amber-600" />
                  <p className="text-xs font-bold text-amber-900">No hay tareas registradas aún</p>
                  <p className="text-[11px] text-amber-700">Agrega al menos una tarea en la Etapa 2 para identificar sus peligros y riesgos asociados.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="mt-2 px-4 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition"
                  >
                    Ir a Etapa 2 (Tareas)
                  </button>
                </div>
              ) : (
                <>
                  {/* 1. Selector Desplegable de Tareas */}
                  <div className="bg-white border-2 border-teal-200/80 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs">
                    <label className="text-xs font-bold text-teal-950 flex items-center justify-between">
                      <span>1. Seleccionar Tarea a Evaluar:</span>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-semibold">
                        {tasks.length} tarea(s) disponible(s)
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTaskId || tasks[0]?.id}
                        onChange={(e) => {
                          setSelectedTaskId(e.target.value);
                          const hazardsForTask = hazards.filter((h) => h.taskId === e.target.value);
                          if (hazardsForTask.length > 0) {
                            setSelectedHazardId(hazardsForTask[0].id);
                          }
                        }}
                        className="w-full bg-[#F8FAFC] border border-teal-300 rounded-xl p-3 text-xs text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer appearance-none pr-10"
                      >
                        {tasks.map((t, idx) => (
                          <option key={t.id} value={t.id}>
                            Tarea #{idx + 1}: {t.name} [{t.taskType}] - Proceso: {t.processName}
                          </option>
                        ))}
                      </select>
                      <LuChevronDown className="w-4 h-4 text-teal-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Banner de Contexto de la Tarea Seleccionada */}
                    {activeTask && (
                      <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl flex items-center justify-between text-xs flex-wrap gap-2 mt-1">
                        <div>
                          <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">
                            Tarea Activa en Análisis
                          </span>
                          <p className="font-black text-teal-950 mt-0.5 text-xs">{activeTask.name}</p>
                          <p className="text-[11px] text-teal-800 mt-0.5">
                            Proceso: {activeTask.processName} {activeTask.subprocessName ? `(${activeTask.subprocessName})` : ""}
                            {activeTask.specificLocation ? ` • 📍 Lugar: ${activeTask.specificLocation}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-teal-800 border border-teal-200 shadow-2xs">
                            {activeTask.taskType}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                            {taskHazards.length} Peligro(s) asignado(s)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Propuesta de Riesgos del Rubro Seleccionado en Onboarding (ej: Minería) */}
                  {activeTask && (
                    <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-teal-50/50 border-2 border-amber-300/80 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-amber-200/70">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
                            <LuShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-gray-900">
                                Riesgos Críticos Propuestos para:
                              </h4>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                {sectorProfile.sector}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-0.5">
                              Sugerencias automáticas para la tarea <b>"{activeTask.name}"</b>. Haz clic para incorporar con medidas de control:
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleLoadAllSectorHazards}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <LuSparkles className="w-3.5 h-3.5" />
                          Cargar todos los riesgos de {sectorProfile.sector}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5">
                        {sectorProfile.suggestedHazards.map((sug) => {
                          const isAlreadyInTask = taskHazards.some(
                            (h) =>
                              h.specificRiskCode === sug.specificRiskCode ||
                              h.hazardDescription === sug.hazardDescription
                          );
                          return (
                            <div
                              key={sug.id}
                              className={clsx(
                                "p-3 rounded-xl border transition flex flex-col justify-between gap-2",
                                isAlreadyInTask
                                  ? "bg-emerald-50/70 border-emerald-200"
                                  : "bg-white border-amber-200/80 hover:border-amber-400 hover:shadow-2xs"
                              )}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                    {sug.specificRiskCode} • {sug.riskClassification}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {sug.tags.map((t, tidx) => (
                                      <span
                                        key={tidx}
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs font-bold text-gray-900 leading-snug">
                                  {sug.hazardDescription}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-1">
                                  <span className="font-semibold text-gray-700">Riesgo:</span> {sug.specificRiskName} ({sug.riskFamily})
                                </p>
                                <p
                                  className="text-[10px] text-teal-700 mt-0.5 font-medium line-clamp-1"
                                  title={sug.recommendedControls[0]?.description}
                                >
                                  🛡️ {sug.recommendedControls[0]?.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-[10px] text-gray-500">
                                  Severidad:{" "}
                                  <b className={sug.defaultSev === 4 ? "text-red-700" : "text-amber-700"}>
                                    {sug.defaultSev === 4 ? "Fatal / Grave" : "Moderada"}
                                  </b>
                                </span>
                                <button
                                  type="button"
                                  disabled={isAlreadyInTask || !activeTask}
                                  onClick={() => handleAddSectorHazardToTask(sug)}
                                  className={clsx(
                                    "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                                    isAlreadyInTask
                                      ? "bg-emerald-100 text-emerald-800 cursor-default"
                                      : "bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
                                  )}
                                >
                                  {isAlreadyInTask ? (
                                    <>
                                      <LuCheck className="w-3 h-3 text-emerald-600" />
                                      Asignado
                                    </>
                                  ) : (
                                    <>
                                      <LuPlus className="w-3 h-3" />
                                      Agregar a Tarea
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Lista de Peligros ya registrados para esta tarea */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center justify-between">
                      <span>Peligros y Riesgos Asociados a esta Tarea ({taskHazards.length})</span>
                      <span className="text-[10px] text-gray-400 font-normal">Una tarea puede tener múltiples peligros</span>
                    </h4>

                    {taskHazards.length === 0 ? (
                      <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500">
                        Aún no hay peligros registrados para esta tarea. Completa el formulario a continuación para agregar el primero.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {taskHazards.map((haz, hIdx) => (
                          <div
                            key={haz.id}
                            className={clsx(
                              "bg-white border rounded-xl p-3.5 flex items-start justify-between gap-3 transition shadow-2xs",
                              selectedHazardId === haz.id ? "border-teal-500 ring-2 ring-teal-500/10" : "border-gray-200 hover:border-teal-300"
                            )}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                                P{hIdx + 1}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-gray-900">{haz.hazardDescription}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                    {haz.specificRiskCode} - {haz.specificRiskName}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-700">
                                    Familia: {haz.riskFamily}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800">
                                    {haz.riskClassification}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveHazard(haz.id)}
                              className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                              title="Eliminar peligro"
                            >
                              <LuTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Formulario para Agregar Nuevo Peligro (ORDEN: Descripción -> Clasificación con tarjetas -> Riesgo filtrado -> Familia) */}
                  <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-4 flex flex-col gap-3.5">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <LuPlus className="w-3.5 h-3.5 text-teal-600" />
                      + Agregar Peligro y Riesgo Asociado a la Tarea
                    </h4>

                    {/* Paso 1 del orden: DESCRIPCIÓN DEL PELIGRO */}
                    <div>
                      <label className="text-xs font-bold text-gray-800 block mb-1">
                        1. Descripción del Peligro y Factores de Riesgo
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Describe el acto inseguro, condición peligrosa o fuente de energía..."
                        value={hazardFormDesc}
                        onChange={(e) => setHazardFormDesc(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    {/* Paso 2 del orden: CLASIFICACIÓN DEL RIESGO CON TARJETAS (SIN ICONOS) */}
                    <div>
                      <label className="text-xs font-bold text-gray-800 block mb-2">
                        2. Clasificación del Riesgo
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {(
                          [
                            "Seguridad",
                            "Emergencias",
                            "Higiénicos",
                            "Psicosociales",
                            "Músculo-esquelético",
                          ] as const
                        ).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setHazardFormClass(cat);
                              const firstRisk = RISK_CATALOGS[cat]?.risks[0];
                              if (firstRisk) {
                                setHazardFormCode(firstRisk.code);
                                setHazardFormName(firstRisk.name);
                                setHazardFormFamily(firstRisk.family);
                              }
                            }}
                            className={clsx(
                              "py-2.5 px-3 rounded-xl border text-center transition cursor-pointer flex items-center justify-center text-xs font-semibold",
                              hazardFormClass === cat
                                ? "bg-teal-50 border-teal-500 text-teal-900 font-bold ring-2 ring-teal-500/20 shadow-2xs"
                                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
                            )}
                          >
                            <span>{cat}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Paso 3 del orden: RIESGO ESPECÍFICO ASOCIADO (FILTRADO POR LA CLASIFICACIÓN SELECCIONADA) y Paso 4: FAMILIA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-800 block mb-1">
                          3. Riesgo Específico ({hazardFormClass})
                        </label>
                        <select
                          value={hazardFormCode}
                          onChange={(e) => {
                            const found = RISK_CATALOGS[hazardFormClass]?.risks.find((r) => r.code === e.target.value);
                            if (found) {
                              setHazardFormCode(found.code);
                              setHazardFormName(found.name);
                              setHazardFormFamily(found.family);
                            }
                          }}
                          className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                        >
                          {RISK_CATALOGS[hazardFormClass]?.risks.map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.code} - {r.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-800 block mb-1">
                          4. Familia del Riesgo
                        </label>
                        <select
                          value={hazardFormFamily}
                          onChange={(e) => setHazardFormFamily(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                        >
                          {RISK_CATALOGS[hazardFormClass]?.families.map((fam) => (
                            <option key={fam} value={fam}>
                              {fam}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Perspectiva de Género */}
                    <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-800">5. Perspectiva de Género (Opcional)</span>
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="hazardGenderRadio"
                              checked={hazardFormGenderDiff === "Si"}
                              onChange={() => setHazardFormGenderDiff("Si")}
                              className="accent-teal-600"
                            />
                            <span>Sí, hay diferencias</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="hazardGenderRadio"
                              checked={hazardFormGenderDiff === "No"}
                              onChange={() => setHazardFormGenderDiff("No")}
                              className="accent-teal-600"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>

                      {hazardFormGenderDiff === "Si" && (
                        <textarea
                          rows={1}
                          placeholder="Indicar diferencias biológicas, ergonómicas o de equipamiento EPP..."
                          value={hazardFormGenderObs}
                          onChange={(e) => setHazardFormGenderObs(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2 text-xs text-gray-800 mt-1"
                        />
                      )}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddHazardToSelectedTask}
                        disabled={!hazardFormDesc.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-xs"
                      >
                        <LuPlus className="w-3.5 h-3.5" />
                        Agregar Peligro a la Tarea
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* =========================================================================
              ETAPA 4: EVALUACIÓN DEL RIESGO (VISIBILIDAD CLARA DE TAREA Y RIESGO)
              ========================================================================= */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                    <LuActivity className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Evaluación del Riesgo Inicial</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isSafetyOrEmergency
                        ? "Evaluación cuantitativa mediante Valor Esperado de Pérdida (VEP con escala 1 Bajo, 2 Medio, 4 Alto)."
                        : "Evaluación de riesgo por protocolo asociado, magnitud y nivel sugerido."}
                    </p>
                  </div>
                </div>
              </div>

              {!activeHazard ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center flex flex-col items-center gap-2">
                  <LuTriangleAlert className="w-6 h-6 text-amber-600" />
                  <p className="text-xs font-bold text-amber-900">No hay peligros registrados para evaluar</p>
                  <p className="text-[11px] text-amber-700">Agrega al menos un peligro en la Etapa 3 para realizar la evaluación de riesgos.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="mt-2 px-4 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition"
                  >
                    Ir a Etapa 3 (Peligros)
                  </button>
                </div>
              ) : (
                <>
                  {/* Selector de Tarea y Riesgo (Apilados verticalmente: Tarea arriba, Peligro abajo) */}
                  <div className="bg-white border-2 border-teal-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        1. Tarea Seleccionada:
                      </label>
                      <select
                        value={selectedTaskId}
                        onChange={(e) => {
                          setSelectedTaskId(e.target.value);
                          const hForTask = hazards.filter((h) => h.taskId === e.target.value);
                          if (hForTask.length > 0) setSelectedHazardId(hForTask[0].id);
                        }}
                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        {tasks.map((t, idx) => (
                          <option key={t.id} value={t.id}>
                            T{idx + 1}: {t.name} [{t.taskType}] - Proceso: {t.processName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        2. Peligro / Riesgo a Evaluar:
                      </label>
                      <select
                        value={activeHazard.id}
                        onChange={(e) => setSelectedHazardId(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        {taskHazards.map((h, hIdx) => (
                          <option key={h.id} value={h.id}>
                            P{hIdx + 1}: {h.specificRiskCode} - {h.specificRiskName} ({h.riskClassification})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Banner de Contexto Visual Destacado */}
                    <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-900">📌 Tarea: {activeTask?.name}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-900">
                            {activeTask?.taskType}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-1 font-medium">
                          ⚠️ Peligro: <span className="font-bold text-gray-900">{activeHazard.hazardDescription}</span>
                        </p>
                        <p className="text-[11px] text-teal-800 mt-0.5">
                          Riesgo: <strong>{activeHazard.specificRiskCode} - {activeHazard.specificRiskName}</strong> (Familia: {activeHazard.riskFamily})
                          {activeTask?.specificLocation ? ` • 📍 Lugar: ${activeTask.specificLocation}` : ""}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white text-teal-900 border border-teal-300 shadow-2xs">
                        {activeHazard.riskClassification}
                      </span>
                    </div>
                  </div>

                  {/* Si es SEGURIDAD O EMERGENCIAS: Escala VEP con 1 Bajo, 2 Medio, 4 Alto */}
                  {isSafetyOrEmergency ? (
                    <div className="flex flex-col gap-4">
                      {/* Probabilidad (P): adaptada según nivel y metodología */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-gray-800">
                            {preferences.experienceLevel === "guided"
                              ? terminology.probabilityQuestion
                              : "Probabilidad (P) de Ocurrencia:"}
                          </label>
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            {preferences.riskEvaluationMethod === "ds44"
                              ? "Norma DS 44 (ISL)"
                              : preferences.riskEvaluationMethod === "matrix5x5"
                              ? "Matriz 5×5"
                              : "Estándar"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { val: 1, label: "1 - Bajo", desc: "Situación controlada / Poco frecuente" },
                            { val: 2, label: "2 - Medio", desc: "Materialización posible / Ocurrencia media" },
                            { val: 4, label: "4 - Alto", desc: "Situación deficiente / Exposición continua" },
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => updateHazardItem(activeHazard.id, { probValue: item.val })}
                              className={clsx(
                                "p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between",
                                activeHazard.probValue === item.val
                                  ? "bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20 font-bold shadow-2xs"
                                  : "bg-white border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              <span className="text-xs font-bold">{item.label}</span>
                              <span className="text-[10px] text-gray-500 font-normal mt-1">{item.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Severidad (C): adaptada según terminología */}
                      <div>
                        <label className="text-xs font-bold text-gray-800 block mb-1.5">
                          {preferences.experienceLevel === "guided"
                            ? terminology.consequenceQuestion
                            : "Severidad / Consecuencia (C):"}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { val: 1, label: "1 - Bajo / Leve", desc: "Lesión menor / Primeros auxilios" },
                            { val: 2, label: "2 - Medio / Moderado", desc: "Lesión con incapacidad temporal / CTP" },
                            { val: 4, label: "4 - Alto / Grave", desc: "Incapacidad permanente o fatalidad" },
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => updateHazardItem(activeHazard.id, { sevValue: item.val })}
                              className={clsx(
                                "p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between",
                                activeHazard.sevValue === item.val
                                  ? "bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20 font-bold shadow-2xs"
                                  : "bg-white border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              <span className="text-xs font-bold">{item.label}</span>
                              <span className="text-[10px] text-gray-500 font-normal mt-1">{item.desc}</span>
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
                            Evaluación inicial antes de aplicar medidas de control jerárquicas
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
                    /* Si es HIGIÉNICOS, PSICOSOCIALES O MÚSCULO-ESQUELÉTICOS */
                    <div className="flex flex-col gap-4">
                      {/* 1. Protocolo Asociado */}
                      <div>
                        <label className="text-xs font-bold text-gray-800 block mb-1">
                          1. Protocolo Asociado (MINSAL / ACHS)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: PREXOR, PLANESI, TMERT-EESS, Guía Técnica Radiación UV, SUSESO-ISTAS 21..."
                          value={activeHazard.protocolApplied}
                          onChange={(e) => updateHazardItem(activeHazard.id, { protocolApplied: e.target.value })}
                          className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                        {/* Sugerencias Rápidas */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          <span className="text-[10px] text-gray-400 font-medium">Sugerencias:</span>
                          {PROTOCOL_SUGGESTIONS[activeHazard.riskClassification]?.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => updateHazardItem(activeHazard.id, { protocolApplied: sug })}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 hover:bg-teal-50 hover:text-teal-800 text-gray-600 transition cursor-pointer"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Magnitud de la Exposición */}
                      <div>
                        <label className="text-xs font-bold text-gray-800 block mb-1">
                          2. Magnitud de la Exposición
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Dosis de ruido 82 dBA en jornada de 8h / Carga física repetitiva > 2 horas continuas..."
                          value={activeHazard.exposureMagnitude}
                          onChange={(e) => updateHazardItem(activeHazard.id, { exposureMagnitude: e.target.value })}
                          className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </div>

                      {/* 3. Nivel del Riesgo (Sugerir Bajo, Medio o Alto) */}
                      <div>
                        <label className="text-xs font-bold text-gray-800 block mb-1.5">
                          3. Nivel del Riesgo
                        </label>
                        <div className="flex items-center gap-3">
                          {(["Bajo", "Medio", "Alto"] as const).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => updateHazardItem(activeHazard.id, { riskLevelType: lvl })}
                              className={clsx(
                                "flex-1 p-3 rounded-xl border text-center transition cursor-pointer text-xs font-bold",
                                activeHazard.riskLevelType === lvl
                                  ? lvl === "Alto"
                                    ? "bg-red-50 border-red-500 text-red-700 ring-2 ring-red-500/20 shadow-2xs"
                                    : lvl === "Medio"
                                      ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20 shadow-2xs"
                                      : "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-2xs"
                                  : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                              )}
                            >
                              {lvl === "Bajo" && "🟢 Nivel Bajo"}
                              {lvl === "Medio" && "🟡 Nivel Medio"}
                              {lvl === "Alto" && "🔴 Nivel Alto"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* =========================================================================
              ETAPA 5: MEDIDAS DE CONTROL (VISIBILIDAD CLARA DE TAREA Y RIESGO)
              ========================================================================= */}
          {currentStep === 5 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                    <LuCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Medidas de Control Jerárquicas</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Establece las medidas de control para mitigar el peligro y riesgo analizado bajo la jerarquía DS 44.
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner Enfoque Controles Críticos (si está activo en Onboarding) */}
              {preferences.riskManagementApproach === "critical_controls" && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs">
                  <LuShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">Enfoque de Controles Críticos (CC) Activo:</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Para riesgos críticos o de alta energía en <b>{sectorProfile.sector}</b>, prioriza Controles de Ingeniería o Eliminación como Controles Críticos indispensables.
                    </p>
                  </div>
                </div>
              )}

              {!activeHazard ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center flex flex-col items-center gap-2">
                  <LuTriangleAlert className="w-6 h-6 text-amber-600" />
                  <p className="text-xs font-bold text-amber-900">No hay peligros registrados para incorporar controles</p>
                  <p className="text-[11px] text-amber-700">Agrega al menos un peligro en la Etapa 3 para configurar sus medidas de control.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="mt-2 px-4 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition"
                  >
                    Ir a Etapa 3 (Peligros)
                  </button>
                </div>
              ) : (
                <>
                  {/* Selector de Tarea y Riesgo (Apilados verticalmente: Tarea arriba, Peligro abajo) */}
                  <div className="bg-white border-2 border-teal-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        1. Tarea Seleccionada:
                      </label>
                      <select
                        value={selectedTaskId}
                        onChange={(e) => {
                          setSelectedTaskId(e.target.value);
                          const hForTask = hazards.filter((h) => h.taskId === e.target.value);
                          if (hForTask.length > 0) setSelectedHazardId(hForTask[0].id);
                        }}
                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        {tasks.map((t, idx) => (
                          <option key={t.id} value={t.id}>
                            T{idx + 1}: {t.name} [{t.taskType}] - Proceso: {t.processName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        2. Peligro / Riesgo Analizado:
                      </label>
                      <select
                        value={activeHazard.id}
                        onChange={(e) => setSelectedHazardId(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        {taskHazards.map((h, hIdx) => (
                          <option key={h.id} value={h.id}>
                            P{hIdx + 1}: {h.specificRiskCode} - {h.specificRiskName} ({h.riskClassification})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Banner de Contexto Visual */}
                    <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div>
                        <p className="font-bold text-teal-950">
                          📌 Tarea: {activeTask?.name} {activeTask?.specificLocation ? `(📍 ${activeTask.specificLocation})` : ""}
                        </p>
                        <p className="text-gray-700 mt-0.5">
                          ⚠️ Peligro: <strong>{activeHazard.hazardDescription}</strong> &bull; Riesgo: <strong>{activeHazard.specificRiskCode} - {activeHazard.specificRiskName}</strong>
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-white text-teal-900 border border-teal-200">
                        {activeHazard.controlsList.length} Control(es)
                      </span>
                    </div>
                  </div>

                  {/* Controles Sugeridos para el Riesgo en este Rubro */}
                  {(() => {
                    const matchedSug = sectorProfile.suggestedHazards.find(
                      (s) =>
                        s.specificRiskCode === activeHazard.specificRiskCode ||
                        s.hazardDescription === activeHazard.hazardDescription
                    );
                    if (!matchedSug || matchedSug.recommendedControls.length === 0) return null;
                    return (
                      <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950">
                          <LuSparkles className="w-3.5 h-3.5 text-teal-600" />
                          <span>Controles sugeridos por buenas prácticas en {sectorProfile.sector}:</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {matchedSug.recommendedControls.map((recCtrl, cIdx) => {
                            const isCtrlAlreadyAdded = activeHazard.controlsList.some(
                              (c) => c.description === recCtrl.description
                            );
                            return (
                              <div
                                key={cIdx}
                                className="flex items-center justify-between p-2 rounded-lg bg-white border border-teal-100 text-xs"
                              >
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-teal-800 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                    {recCtrl.type}
                                  </span>
                                  {recCtrl.isCritical && (
                                    <span className="font-black text-amber-900 text-[9px] bg-amber-100 px-1.5 py-0.5 rounded">
                                      Control Crítico
                                    </span>
                                  )}
                                  <span className="text-gray-800">{recCtrl.description}</span>
                                </div>
                                <button
                                  type="button"
                                  disabled={isCtrlAlreadyAdded}
                                  onClick={() => {
                                    const newC: ControlItem = {
                                      id: `ctrl-rec-${Date.now()}-${cIdx}`,
                                      type: recCtrl.type,
                                      description: recCtrl.description,
                                      responsible: matrix.responsible || "Prevencionista de Riesgos",
                                    };
                                    updateHazardItem(activeHazard.id, {
                                      controlsList: [...activeHazard.controlsList, newC],
                                    });
                                  }}
                                  className={clsx(
                                    "px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer flex-shrink-0 ml-2",
                                    isCtrlAlreadyAdded
                                      ? "bg-emerald-100 text-emerald-800 cursor-default"
                                      : "bg-teal-600 hover:bg-teal-700 text-white"
                                  )}
                                >
                                  {isCtrlAlreadyAdded ? "Agregado" : "+ Agregar"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Lista de Medidas de Control Registradas para este peligro */}
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
                          onChange={(e) => setNewControlType(e.target.value as ControlItem["type"])}
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
                </>
              )}
            </div>
          )}

          {/* =========================================================================
              ETAPA 6: REEVALUACIÓN DEL RIESGO RESIDUAL
              ========================================================================= */}
          {currentStep === 6 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                    <LuCircleCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Reevaluación del Riesgo Residual</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Verifica la eficacia de las medidas de control calculando el riesgo residual después de la intervención (DS 44).
                    </p>
                  </div>
                </div>
              </div>

              {!activeHazard ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center flex flex-col items-center gap-2">
                  <LuTriangleAlert className="w-6 h-6 text-amber-600" />
                  <p className="text-xs font-bold text-amber-900">No hay evaluaciones para reevaluar</p>
                  <p className="text-[11px] text-amber-700">Primero debes agregar y evaluar peligros en las etapas anteriores.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="mt-2 px-4 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition"
                  >
                    Ir a Etapa 3 (Peligros)
                  </button>
                </div>
              ) : (
                <>
                  {/* Selector de Tarea y Riesgo (Apilados verticalmente: Tarea arriba, Peligro abajo) */}
                  <div className="bg-white border-2 border-teal-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        1. Tarea Seleccionada:
                      </label>
                      <select
                        value={selectedTaskId}
                        onChange={(e) => {
                          setSelectedTaskId(e.target.value);
                          const hForTask = hazards.filter((h) => h.taskId === e.target.value);
                          if (hForTask.length > 0) setSelectedHazardId(hForTask[0].id);
                        }}
                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        {tasks.map((t, idx) => (
                          <option key={t.id} value={t.id}>
                            T{idx + 1}: {t.name} [{t.taskType}] - Proceso: {t.processName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        2. Peligro / Riesgo a Reevaluar:
                      </label>
                      <select
                        value={activeHazard.id}
                        onChange={(e) => setSelectedHazardId(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        {taskHazards.map((h, hIdx) => (
                          <option key={h.id} value={h.id}>
                            P{hIdx + 1}: {h.specificRiskCode} - {h.specificRiskName} ({h.riskClassification})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Banner Contextual */}
                    <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl flex items-center justify-between text-xs flex-wrap gap-2">
                      <div>
                        <span className="font-bold text-teal-950">
                          Tarea: {activeTask?.name} {activeTask?.specificLocation ? `(📍 ${activeTask.specificLocation})` : ""}
                        </span>
                        <p className="text-gray-700 mt-0.5">
                          Peligro: {activeHazard.hazardDescription} ({activeHazard.specificRiskCode} - {activeHazard.specificRiskName})
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800">
                        {activeHazard.riskClassification}
                      </span>
                    </div>
                  </div>

                  {/* Si es Seguridad / Emergencia: Probabilidad y Severidad Residual con 1, 2, 4 con bloqueo estricto */}
                  {isSafetyOrEmergency ? (
                    <div className="flex flex-col gap-4">
                      {/* Selector de Probabilidad Residual */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-gray-800">
                            Probabilidad Residual (debe ser &le; Probabilidad Inicial {activeHazard.probValue}):
                          </label>
                          <span className="text-[10px] text-gray-400 font-medium">Opciones superiores bloqueadas</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { val: 1, label: "1 - Baja", desc: "Control eficaz y verificado" },
                            { val: 2, label: "2 - Media", desc: "Control parcial / En implementación" },
                            { val: 4, label: "4 - Alta", desc: "Requiere revisión urgente" },
                          ].map((p) => {
                            const isBlocked = p.val > activeHazard.probValue;
                            return (
                              <button
                                key={p.val}
                                type="button"
                                disabled={isBlocked}
                                onClick={() => updateHazardItem(activeHazard.id, { residualProb: p.val })}
                                className={clsx(
                                  "p-3 rounded-xl border text-left transition flex flex-col justify-between",
                                  isBlocked && "opacity-35 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through",
                                  !isBlocked && activeHazard.residualProb === p.val && "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-2xs cursor-pointer",
                                  !isBlocked && activeHazard.residualProb !== p.val && "bg-white border-gray-200 hover:bg-gray-50 cursor-pointer"
                                )}
                              >
                                <span className="text-xs font-bold flex items-center justify-between">
                                  {p.label}
                                  {isBlocked && <LuLock className="w-3 h-3 text-gray-400" />}
                                </span>
                                <span className="text-[10px] text-gray-500 font-normal mt-1">{p.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selector de Severidad Residual */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-gray-800">
                            Severidad / Consecuencia Residual (debe ser &le; Severidad Inicial {activeHazard.sevValue}):
                          </label>
                          <span className="text-[10px] text-gray-400 font-medium">Opciones superiores bloqueadas</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { val: 1, label: "1 - Leve", desc: "Sin tiempo perdido / Daño menor" },
                            { val: 2, label: "2 - Moderada", desc: "Incapacidad temporal mitigada" },
                            { val: 4, label: "4 - Grave", desc: "Daño mayor persistente" },
                          ].map((s) => {
                            const isBlocked = s.val > activeHazard.sevValue;
                            return (
                              <button
                                key={s.val}
                                type="button"
                                disabled={isBlocked}
                                onClick={() => updateHazardItem(activeHazard.id, { residualSev: s.val })}
                                className={clsx(
                                  "p-3 rounded-xl border text-left transition flex flex-col justify-between",
                                  isBlocked && "opacity-35 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through",
                                  !isBlocked && activeHazard.residualSev === s.val && "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-2xs cursor-pointer",
                                  !isBlocked && activeHazard.residualSev !== s.val && "bg-white border-gray-200 hover:bg-gray-50 cursor-pointer"
                                )}
                              >
                                <span className="text-xs font-bold flex items-center justify-between">
                                  {s.label}
                                  {isBlocked && <LuLock className="w-3 h-3 text-gray-400" />}
                                </span>
                                <span className="text-[10px] text-gray-500 font-normal mt-1">{s.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Comparativa Inicial vs Residual */}
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4.5 grid grid-cols-2 gap-4 text-center">
                        <div className="border-r border-emerald-200/60 pr-2">
                          <p className="text-[11px] text-gray-500 font-medium">
                            {preferences.experienceLevel === "guided"
                              ? "Riesgo Inicial sin Medidas"
                              : "Riesgo Inicial (VEP)"}
                          </p>
                          <p className="text-xl font-black text-gray-900 mt-0.5">{vepScore} pts</p>
                          <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-block mt-1">
                            {getVepLevel(vepScore).label}
                          </span>
                        </div>

                        <div className="pl-2">
                          <p className="text-[11px] text-gray-500 font-medium">
                            {preferences.experienceLevel === "guided"
                              ? terminology.residualRisk
                              : "Riesgo Residual Final"}
                          </p>
                          <p className="text-xl font-black text-emerald-700 mt-0.5">{residualScoreCalc} pts</p>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                            {residualScoreCalc <= 2 ? "Tolerable / Bajo" : "Moderado / Controlado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Para Higiénicos / Psicosociales / Músculo-esqueléticos */
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-800 block mb-1.5">
                          Nivel de Riesgo Residual (Inicial: {activeHazard.riskLevelType})
                        </label>
                        <div className="flex items-center gap-3">
                          {(["Bajo", "Medio", "Alto"] as const).map((lvl) => {
                            const rankMap: Record<string, number> = { Bajo: 1, Medio: 2, Alto: 3 };
                            const initialRank = rankMap[activeHazard.riskLevelType] || 2;
                            const isBlocked = (rankMap[lvl] || 1) > initialRank;

                            return (
                              <button
                                key={lvl}
                                type="button"
                                disabled={isBlocked}
                                onClick={() => updateHazardItem(activeHazard.id, { residualRiskLevel: lvl })}
                                className={clsx(
                                  "flex-1 p-3 rounded-xl border text-center transition text-xs font-bold",
                                  isBlocked && "opacity-35 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through",
                                  !isBlocked && activeHazard.residualRiskLevel === lvl && "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-2xs cursor-pointer",
                                  !isBlocked && activeHazard.residualRiskLevel !== lvl && "bg-white border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                                )}
                              >
                                {lvl === "Bajo" && "🟢 Residual Bajo"}
                                {lvl === "Medio" && "🟡 Residual Medio"}
                                {lvl === "Alto" && "🔴 Residual Alto"}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-800 block mb-1">
                          Eficacia y Observaciones de Controles
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Controles implementados al 100%, reevaluación programada en 6 meses..."
                          value={activeHazard.residualEfficacy || ""}
                          onChange={(e) => updateHazardItem(activeHazard.id, { residualEfficacy: e.target.value })}
                          className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-medium"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Resumen de Tareas y Peligros */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
                <p className="font-bold text-gray-800 mb-1">
                  Resumen de confección ({tasks.length} tarea{tasks.length > 1 ? "s" : ""}, {hazards.length} peligro{hazards.length > 1 ? "s" : ""})
                </p>
                <p>
                  Al finalizar, se incorporarán todas las evaluaciones generadas a la matriz <strong>{matrix.code}</strong> en estado <em>En revisión</em>.
                </p>
              </div>
            </div>
          )}

          {/* Mensaje de Validación y Bloqueo si faltan datos */}
          {currentStepError && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mt-4 animate-in fade-in">
              <LuCircleAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="font-medium">{currentStepError}</span>
            </div>
          )}

          {/* Botones de Navegación del Wizard */}
          <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-5">
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
                onClick={() => {
                  if (canAdvanceCurrentStep) {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                disabled={!canAdvanceCurrentStep}
                className={clsx(
                  "flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer",
                  canAdvanceCurrentStep
                    ? "bg-teal-600 hover:bg-teal-700"
                    : "bg-gray-300 opacity-60 cursor-not-allowed"
                )}
              >
                Siguiente
                <LuArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishWizard}
                disabled={!canAdvanceCurrentStep}
                className={clsx(
                  "flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition cursor-pointer",
                  canAdvanceCurrentStep
                    ? "bg-[#F04438] hover:bg-[#D92D20]"
                    : "bg-gray-300 opacity-60 cursor-not-allowed"
                )}
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
            <p className="text-[11px] text-gray-500 mt-0.5">
              {matrix.workCenter ? `Centro: ${matrix.workCenter}` : ""}
              {workArea ? (matrix.workCenter ? ` • Área: ${workArea}` : `Área: ${workArea}`) : ""}
            </p>
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

            {activeTask && (
              <div>
                <span className="text-gray-400 text-[11px] font-medium block">Tarea Activa:</span>
                <p className="font-semibold text-gray-900 line-clamp-1">{activeTask.name}</p>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block mt-0.5 font-bold">
                  {activeTask.taskType}
                </span>
              </div>
            )}

            <div>
              <span className="text-gray-400 text-[11px] font-medium block">Total Peligros Registrados:</span>
              <p className="font-bold text-gray-800">{hazards.length} peligro(s) en la matriz</p>
            </div>

            {activeHazard && activeHazard.hazardDescription && (
              <div>
                <span className="text-gray-400 text-[11px] font-medium block">Peligro en Foco:</span>
                <p className="text-gray-700 text-[11px] line-clamp-2 mt-0.5">{activeHazard.hazardDescription}</p>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1">
                  {activeHazard.specificRiskCode} - {activeHazard.specificRiskName}
                </span>
              </div>
            )}

            {activeHazard && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">
                    {isSafetyOrEmergency ? "VEP Inicial" : "Nivel Inicial"}
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {isSafetyOrEmergency ? `${vepScore} pts` : activeHazard.riskLevelType}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-medium">
                    {isSafetyOrEmergency ? "Riesgo Residual" : "Nivel Residual"}
                  </span>
                  <span className="text-base font-bold text-emerald-600">
                    {isSafetyOrEmergency ? `${residualScoreCalc} pts` : activeHazard.residualRiskLevel || "Bajo"}
                  </span>
                </div>
              </div>
            )}

            <div>
              <span className="text-gray-400 text-[11px] font-medium block">
                Medidas de Control del Peligro: {activeHazard ? activeHazard.controlsList.length : 0}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
