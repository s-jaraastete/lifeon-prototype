"use client";

import { useState, useEffect, useMemo } from "react";
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
  LuArrowRight,
  LuRotateCw,
  LuCircleCheck,
  LuCircleAlert,
  LuCircleX,
  LuPencil,
  LuSend,
  LuMessageSquare,
  LuHistory,
  LuLink,
  LuClock,
  LuFileText,
  LuCalendar,
  LuShieldAlert,
  LuFolderTree,
  LuActivity,
  LuShieldCheck,
  LuPrinter,
} from "react-icons/lu";
import * as XLSX from "xlsx";
import {
  createThemedDataSheet,
  createThemedInstructionsSheet,
  normalizeImportedRows,
  parseIperWorkbookWithMetadata,
} from "@/lib/xlsx/lifeOnWorkbookTheme";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { getSectorRiskProfile } from "@/data/sectorRiskTemplates";
import IperMatrixDetailView, { IperEvaluationRow } from "./IperMatrixDetailView";
import OrgStructureModal from "./OrgStructureModal";
import IperModuleOnboardingModal from "./IperModuleOnboardingModal";
import { convert5x5ToVep3x3 } from "@/lib/riskEngine/riskEquivalence";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import {
  saveIperMatricesToSupabase,
  fetchIperMatricesFromSupabase,
  deleteIperMatrixFromSupabase,
} from "@/lib/services/supabaseService";

export type MatrixStatus =
  | "Vigente"
  | "En revisión"
  | "Borrador"
  | "Observada"
  | "En actualización"
  | "En aprobación"
  | "Vencida"
  | "Rechazada"
  | "Observado"
  | "En modificación"
  | "Vencido"
  | "No iniciado";

export interface IperMatrixItem {
  id: string;
  code: string;
  name: string;
  title?: string;
  workCenter: string;
  responsible: string;
  totalRecords: number | string;
  intolerableRisks: number | string;
  expiryText: string;
  lastReviewDate?: string;
  isExpired?: boolean;
  status: MatrixStatus;
  scope?: "work_center" | "area" | "process";
  workCenterId?: string;
  workCenterName?: string;
  areaId?: string;
  areaName?: string;
  processId?: string;
  processName?: string;
  description?: string;
  evaluations?: IperEvaluationRow[];
}

export interface SafetyEmergencyRiskItem {
  id: string;
  title: string;
  category: "Seguridad" | "Emergencia";
  area: string;
  aspect: string;
  // Escala 5x5
  prob5x5: number;
  impact5x5: number;
  val5x5: number;
  // Escala 3x3 VEP (DS 44)
  prob3x3: number;
  severidad3x3: number;
  vep: number;
  vepLevel: "Bajo" | "Medio" | "Alto" | "Crítico";
  evaluatedScore: string;
}

export interface ProtocolRiskItem {
  id: string;
  title: string;
  riskFamily: "Higiénico" | "Psicosocial" | "Musculoesquelético";
  protocolName: string;
  normativeBasis: string;
  area: string;
  jobPosition: string;
  magnitude: string;
  exposureType: "Cuantitativa" | "Cualitativa / Lista Chequeo";
  riskLevel: "Bajo" | "Medio" | "Crítico";
  actionRequired: string;
  lastEvaluationDate: string;
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

export const getStatusBadgeStyle = (status: MatrixStatus) => {
  switch (status) {
    case "Vigente":
      return "bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]";
    case "En revisión":
      return "bg-[#EFF6FF] text-[#3B82F6] border-[#BFDBFE]";
    case "Borrador":
      return "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
    case "Observada":
    case "Observado":
      return "bg-[#FEF9C3] text-[#CA8A04] border-[#FDE047]";
    case "En actualización":
    case "En modificación":
      return "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]";
    case "En aprobación":
      return "bg-[#FAF5FF] text-[#9333EA] border-[#E9D5FF]";
    case "Vencida":
    case "Vencido":
      return "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
    case "Rechazada":
      return "bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]";
    case "No iniciado":
      return "bg-[#F3F4F6] text-[#6B7280] border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export const INITIAL_MATRICES: IperMatrixItem[] = [
  {
    id: "1",
    code: "MA-001",
    name: "Operación de equipos pesados y movimiento de tierras",
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
    name: "Mina Roja - Sector Norte y Perforaciones",
    workCenter: "Mina Roja",
    responsible: "Carlos Mora Rocha",
    totalRecords: 142,
    intolerableRisks: 19,
    expiryText: "En evaluación",
    status: "En revisión",
  },
  {
    id: "3",
    code: "MA-003",
    name: "Mantenimiento e instalaciones eléctricas BT/MT",
    workCenter: "Taller central",
    responsible: "Ramiro Fuentes Rojas",
    totalRecords: 12,
    intolerableRisks: 0,
    expiryText: "Borrador preliminar",
    status: "Borrador",
  },
  {
    id: "4",
    code: "MA-004",
    name: "Bodega y manejo de sustancias químicas",
    workCenter: "Planta Quilicura",
    responsible: "Ramiro Fuentes Rojas",
    totalRecords: 28,
    intolerableRisks: 2,
    expiryText: "2 observaciones",
    status: "Observada",
  },
  {
    id: "5",
    code: "MA-005",
    name: "Trabajos en caliente, corte y soldadura estructural",
    workCenter: "Centro Lo Espejo",
    responsible: "Diego Morales Vera",
    totalRecords: 34,
    intolerableRisks: 3,
    expiryText: "Solicitud en curso",
    status: "En actualización",
  },
  {
    id: "6",
    code: "MA-006",
    name: "Excavaciones profundas, zanjas y entibaciones",
    workCenter: "Centro Lo Espejo",
    responsible: "Patricia Valenzuela",
    totalRecords: 45,
    intolerableRisks: 5,
    expiryText: "Pendiente de firma",
    status: "En aprobación",
  },
  {
    id: "7",
    code: "MA-007",
    name: "Operación de calderas y generación de vapor",
    workCenter: "Planta Renca",
    responsible: "Héctor Espinoza Soto",
    totalRecords: 22,
    intolerableRisks: 1,
    expiryText: "Vencida hace 5 días",
    isExpired: true,
    status: "Vencida",
  },
  {
    id: "8",
    code: "MA-008",
    name: "Transporte de personal y faenas nocturnas",
    workCenter: "Ruta Minera Central",
    responsible: "Camila Oyarzún",
    totalRecords: 18,
    intolerableRisks: 0,
    expiryText: "Rechazada por comité",
    isExpired: true,
    status: "Rechazada",
  },
];

const INITIAL_SAFETY_EMERGENCY_RISKS: SafetyEmergencyRiskItem[] = [
  {
    id: "sec-1",
    title: "Caída de distinto nivel en faena (> 1.80m)",
    category: "Seguridad",
    area: "Montaje y Estructuras",
    aspect: "Trabajos en andamios y plataformas elevadas",
    prob5x5: 2,
    impact5x5: 5,
    val5x5: 19,
    prob3x3: 4,
    severidad3x3: 4,
    vep: 16,
    vepLevel: "Crítico",
    evaluatedScore: "VEP 16 (Crítico)",
  },
  {
    id: "sec-2",
    title: "Atrapamiento en faja transportadora",
    category: "Seguridad",
    area: "Planta de Chancado",
    aspect: "Limpieza o inspección con maquinaria en movimiento",
    prob5x5: 3,
    impact5x5: 4,
    val5x5: 17,
    prob3x3: 2,
    severidad3x3: 4,
    vep: 8,
    vepLevel: "Alto",
    evaluatedScore: "VEP 8 (Alto)",
  },
  {
    id: "sec-3",
    title: "Contacto eléctrico directo con tablero energizado",
    category: "Seguridad",
    area: "Subestación Eléctrica",
    aspect: "Intervención de circuitos sin bloqueo LOTO",
    prob5x5: 1,
    impact5x5: 5,
    val5x5: 18,
    prob3x3: 1,
    severidad3x3: 4,
    vep: 4,
    vepLevel: "Medio",
    evaluatedScore: "VEP 4 (Medio)",
  },
  {
    id: "sec-4",
    title: "Incendio en bodega de sustancias inflamables",
    category: "Emergencia",
    area: "Bodega de Químicos y Combustibles",
    aspect: "Fuga de vapores y fuentes de ignición en almacenamiento",
    prob5x5: 2,
    impact5x5: 4,
    val5x5: 16,
    prob3x3: 2,
    severidad3x3: 4,
    vep: 8,
    vepLevel: "Alto",
    evaluatedScore: "VEP 8 (Alto)",
  },
  {
    id: "sec-5",
    title: "Colisión de maquinaria pesada y camionetas de faena",
    category: "Seguridad",
    area: "Ruta y Patio de Maniobras",
    aspect: "Tránsito simultáneo con puntos ciegos y exceso de velocidad",
    prob5x5: 3,
    impact5x5: 3,
    val5x5: 14,
    prob3x3: 2,
    severidad3x3: 2,
    vep: 4,
    vepLevel: "Medio",
    evaluatedScore: "VEP 4 (Medio)",
  },
  {
    id: "sec-6",
    title: "Derrame mayor de ácido concentrado",
    category: "Emergencia",
    area: "Lixiviación / Patio Químico",
    aspect: "Falla en válvula o rotura de manguera de trasvasije",
    prob5x5: 1,
    impact5x5: 4,
    val5x5: 12,
    prob3x3: 1,
    severidad3x3: 2,
    vep: 2,
    vepLevel: "Bajo",
    evaluatedScore: "VEP 2 (Bajo)",
  },
  {
    id: "sec-7",
    title: "Golpe o corte por herramientas manuales en taller",
    category: "Seguridad",
    area: "Taller Mecánico",
    aspect: "Uso de esmeril angular y llaves de impacto",
    prob5x5: 4,
    impact5x5: 2,
    val5x5: 9,
    prob3x3: 4,
    severidad3x3: 1,
    vep: 4,
    vepLevel: "Medio",
    evaluatedScore: "VEP 4 (Medio)",
  },
  {
    id: "sec-8",
    title: "Sismo de alta magnitud con desprendimiento de carga",
    category: "Emergencia",
    area: "Bodega Central / Racks",
    aspect: "Movimiento telúrico que compromete anclajes estructurales",
    prob5x5: 2,
    impact5x5: 5,
    val5x5: 19,
    prob3x3: 1,
    severidad3x3: 4,
    vep: 4,
    vepLevel: "Medio",
    evaluatedScore: "VEP 4 (Medio)",
  },
];

const INITIAL_PROTOCOL_RISKS: ProtocolRiskItem[] = [
  {
    id: "prot-1",
    title: "Movimiento repetitivo extremidad superior en envasado",
    riskFamily: "Musculoesquelético",
    protocolName: "TMERT-EESS (D.Ex. 804 Minsal)",
    normativeBasis: "Norma Técnica Minsal TMERT / DS 594",
    area: "Línea de Envasado",
    jobPosition: "Operario de Empaque y Sellado",
    magnitude: "Ciclos de trabajo < 30 seg repetidos por más del 50% de la jornada laboral sin pausa ergonómica",
    exposureType: "Cualitativa / Lista Chequeo",
    riskLevel: "Crítico",
    actionRequired: "Rediseño de puesto de trabajo y pausas activas obligatorias. Envío a vigilancia médica mutual.",
    lastEvaluationDate: "12-01-2026",
  },
  {
    id: "prot-2",
    title: "Exposición a ruido ocupacional continuo en chancador",
    riskFamily: "Higiénico",
    protocolName: "PREXOR (D.Ex. 1029 Minsal)",
    normativeBasis: "Protocolo PREXOR / DS 594 Art. 75",
    area: "Chancado Primario",
    jobPosition: "Operador de Planta de Chancado",
    magnitude: "Dosis diaria: 142% (Nivel continuo equivalente Leq: 87.8 dBA, excede criterio de acción de 82 dBA)",
    exposureType: "Cuantitativa",
    riskLevel: "Crítico",
    actionRequired: "Aislamiento acústico de cabina, uso de doble protección auditiva (copa + tapón) y audiometría.",
    lastEvaluationDate: "20-11-2025",
  },
  {
    id: "prot-3",
    title: "Exposición a polvo de sílice libre cristalizada",
    riskFamily: "Higiénico",
    protocolName: "PLANESI (ISP / Minsal)",
    normativeBasis: "Plan Nacional Erradicación Silicosis / DS 594 Art. 66",
    area: "Perforación y Frente de Avance",
    jobPosition: "Perforista Minero",
    magnitude: "Concentración medida: 0.054 mg/m³ fracción respirable (Límite Permisible Ponderado: 0.040 mg/m³)",
    exposureType: "Cuantitativa",
    riskLevel: "Crítico",
    actionRequired: "Perforación húmeda obligatoria, sistema de aspiración localizada y mascarilla medio rostro P100.",
    lastEvaluationDate: "05-12-2025",
  },
  {
    id: "prot-4",
    title: "Carga de trabajo y ritmo acelerado (Factores Psicosociales)",
    riskFamily: "Psicosocial",
    protocolName: "CEAL-SM / SUSESO (Res. Ex. 1448)",
    normativeBasis: "Cuestionario CEAL-SM / SUSESO / DS 44",
    area: "Operaciones y Logística",
    jobPosition: "Coordinadores y Despachadores",
    magnitude: "Dimensión 'Carga y Ritmo de Trabajo' con 72% de trabajadores en nivel desfavorable (Riesgo Alto)",
    exposureType: "Cualitativa / Lista Chequeo",
    riskLevel: "Crítico",
    actionRequired: "Comité de aplicación activo. Plan de rediseño de turnos y redistribución de cargas acordado.",
    lastEvaluationDate: "15-01-2026",
  },
  {
    id: "prot-5",
    title: "Exposición a radiación ultravioleta de origen solar",
    riskFamily: "Higiénico",
    protocolName: "Radiación UV Solar (DS 594 Art. 109a)",
    normativeBasis: "Guía Técnica Radiación UV / DS 594",
    area: "Patio de Acopio Exterior",
    jobPosition: "Cuadrilla de Patio y Choferes",
    magnitude: "Índice UV diario promedio entre 8 y 11 (Muy Alto a Extremo) en el horario de 11:00 a 16:30 hrs",
    exposureType: "Cuantitativa",
    riskLevel: "Medio",
    actionRequired: "Uso de legionario (cubrenuca), protector solar FPS 50+ cada 2 horas y áreas sombreadas en descanso.",
    lastEvaluationDate: "02-02-2026",
  },
  {
    id: "prot-6",
    title: "Manejo manual de carga reiterado en bodega de insumos",
    riskFamily: "Musculoesquelético",
    protocolName: "MMC (Ley 20.949 / DS 63)",
    normativeBasis: "Ley 20.949 'Ley del Saco' / DS 63",
    area: "Bodega de Reactivos",
    jobPosition: "Bodeguero Auxiliar",
    magnitude: "Levantamiento manual de sacos de 25 kg desde nivel de piso a 1.6m con frecuencia de 60 levantamientos/hora",
    exposureType: "Cualitativa / Lista Chequeo",
    riskLevel: "Medio",
    actionRequired: "Instalación de mesa elevadora hidráulica y transpaleta eléctrica. Capacitación en técnica de MMC.",
    lastEvaluationDate: "18-01-2026",
  },
  {
    id: "prot-7",
    title: "Exposición a vibración mano-brazo por uso de rotomartillo",
    riskFamily: "Higiénico",
    protocolName: "Vibraciones (DS 594 Art. 83-94)",
    normativeBasis: "DS 594 / Guía ISP Vibración Mano-Brazo",
    area: "Mantenimiento Obras Civiles",
    jobPosition: "Maestro Albañil / Demoledor",
    magnitude: "Aceleración equivalente ponderada A(8) de 2.2 m/s² (por debajo del límite de acción de 2.5 m/s²)",
    exposureType: "Cuantitativa",
    riskLevel: "Bajo",
    actionRequired: "Mantenimiento preventivo de herramientas antivibratorias y uso de guantes certificados.",
    lastEvaluationDate: "10-01-2026",
  },
];

export interface Grid3x3Cell {
  prob: number;
  severidad: number;
  vep: number;
  color: "green" | "yellow" | "orange" | "red";
  level: "Bajo" | "Medio" | "Alto" | "Crítico";
}

const GRID_3X3_VEP: Grid3x3Cell[][] = [
  // Severidad 4: Fatal / Grave (Fila 0)
  [
    { prob: 1, severidad: 4, vep: 4, color: "yellow", level: "Medio" },
    { prob: 2, severidad: 4, vep: 8, color: "orange", level: "Alto" },
    { prob: 4, severidad: 4, vep: 16, color: "red", level: "Crítico" },
  ],
  // Severidad 2: Moderada / Grave (Fila 1)
  [
    { prob: 1, severidad: 2, vep: 2, color: "green", level: "Bajo" },
    { prob: 2, severidad: 2, vep: 4, color: "yellow", level: "Medio" },
    { prob: 4, severidad: 2, vep: 8, color: "orange", level: "Alto" },
  ],
  // Severidad 1: Leve (Fila 2)
  [
    { prob: 1, severidad: 1, vep: 1, color: "green", level: "Bajo" },
    { prob: 2, severidad: 1, vep: 2, color: "green", level: "Bajo" },
    { prob: 4, severidad: 1, vep: 4, color: "yellow", level: "Medio" },
  ],
];

// Matrix Heatmap Definition (5 Rows x 5 Cols)
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

interface MatrixActionItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  isDanger?: boolean;
}

export default function IperMatrixView({
  onOpenAprVirtual,
  onNavigateToOrg,
}: {
  onOpenAprVirtual?: () => void;
  onNavigateToOrg?: () => void;
}) {
  const { preferences, configureMiperModule, currentUser } = useLifeOnPreferences();
  const sectorProfile = useMemo(() => {
    return getSectorRiskProfile(preferences.organizationSector);
  }, [preferences.organizationSector]);

  const isMiperConfigured = preferences.moduleConfigurations?.miper?.configured ?? false;
  const currentMethodology = preferences.moduleConfigurations?.miper?.methodology || "dynamic5x5_vep";

  const orgId = currentUser?.orgId || "org_demo";
  const storageKey = `lifeon_iper_matrices_${orgId}`;

  const [viewMode, setViewMode] = useState<"grid" | "list" | "significance">("grid");
  const [matrices, setMatrices] = useState<IperMatrixItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`lifeon_iper_matrices_${currentUser?.orgId || "org_demo"}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return (!currentUser?.orgId || currentUser?.orgId === "org_demo") ? INITIAL_MATRICES : [];
  });

  const updateAndPersistMatrices = (newMatrices: IperMatrixItem[]) => {
    setMatrices(newMatrices);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newMatrices));
        window.dispatchEvent(
          new CustomEvent("lifeon-iper-matrices-change", {
            detail: { orgId, matrices: newMatrices },
          })
        );
      } catch (e) {}
    }
    saveIperMatricesToSupabase(newMatrices, orgId);
  };

  const [selectedMatrix, setSelectedMatrix] = useState<IperMatrixItem | null>(null);
  const [openWizardOnSelect, setOpenWizardOnSelect] = useState(false);

  // Mapa de Clasificación de Riesgos (3x3 VEP vs 5x5 según Metodología)
  const [activeGridScale, setActiveGridScale] = useState<"3x3" | "5x5">(() =>
    currentMethodology === "matrix5x5" ? "5x5" : "3x3"
  );

  useEffect(() => {
    if (currentMethodology === "matrix5x5") {
      setActiveGridScale("5x5");
    } else if (currentMethodology === "vep3x3") {
      setActiveGridScale("3x3");
    }
  }, [currentMethodology]);

  const isDemo = !currentUser?.orgId || currentUser?.orgId === "org_demo";
  const [safetyRisks, setSafetyRisks] = useState<SafetyEmergencyRiskItem[]>(() =>
    isDemo ? INITIAL_SAFETY_EMERGENCY_RISKS : []
  );
  const [protocolRisks, setProtocolRisks] = useState<ProtocolRiskItem[]>(() =>
    isDemo ? INITIAL_PROTOCOL_RISKS : []
  );

  // Sincronizar al cambiar de usuario o montar
  useEffect(() => {
    let localData: IperMatrixItem[] | null = null;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) localData = parsed;
        }
      } catch (e) {}
    }

    const isOrgDemo = !orgId || orgId === "org_demo";

    if (localData && localData.length > 0) {
      setMatrices(localData);
    } else if (!isOrgDemo) {
      setMatrices([]);
    } else {
      setMatrices(INITIAL_MATRICES);
    }

    if (!isOrgDemo) {
      setSafetyRisks([]);
      setProtocolRisks([]);
    } else {
      setSafetyRisks(INITIAL_SAFETY_EMERGENCY_RISKS);
      setProtocolRisks(INITIAL_PROTOCOL_RISKS);
    }

    // Sincronizar con Supabase
    fetchIperMatricesFromSupabase(orgId).then((remote) => {
      if (remote && Array.isArray(remote) && remote.length > 0) {
        setMatrices(remote);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(storageKey, JSON.stringify(remote));
          } catch (e) {}
        }
      }
    });
  }, [orgId, storageKey]);

  const [selectedCell3x3, setSelectedCell3x3] = useState<{ prob: number; severidad: number; vep: number } | null>(null);
  const [selectedCell5x5, setSelectedCell5x5] = useState<{ prob: number; impact: number; val: number } | null>(null);

  const [safetyCategoryFilter, setSafetyCategoryFilter] = useState<"Todos" | "Seguridad" | "Emergencia">("Todos");
  const [protocolFamilyFilter, setProtocolFamilyFilter] = useState<"Todos" | "Higiénico" | "Psicosocial" | "Musculoesquelético">("Todos");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  // Modals and Active Dropdown State
  const { totalAreasCount, areas, positions, workCenters } = useOrgStructure();
  const [isOrgStructureOpen, setIsOrgStructureOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [isNewMatrixOpen, setIsNewMatrixOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estados de Metodología y Bloqueo (Reqs 10-11)
  const [isMethodologyModalDismissed, setIsMethodologyModalDismissed] = useState(false);
  const [isMethodologyModalExplicitOpen, setIsMethodologyModalExplicitOpen] = useState(false);
  const [methodologyPromptMessage, setMethodologyPromptMessage] = useState<string | undefined>(undefined);

  // Estados de Información de Riesgos Laborales (IRL) (Reqs 13-16)
  const [isIrlCargoListOpen, setIsIrlCargoListOpen] = useState(false);
  const [selectedIrlCargoItem, setSelectedIrlCargoItem] = useState<{
    cargo: string;
    area: string;
    matrices: IperMatrixItem[];
    lastUpdate: string;
    status: "Actualizado" | "Pendiente";
    risks: {
      task: string;
      hazard: string;
      riskEvent: string;
      controls: string;
      matrixCode: string;
      matrixName: string;
      area: string;
    }[];
  } | null>(null);

  // Matrices en estado Vigente (Fuente exclusiva para IRL según Reqs 3-7)
  const vigentesMatrices = useMemo(
    () => matrices.filter((m) => m.status === "Vigente"),
    [matrices]
  );

  // Consolidación de IRL por Cargo EXCLUSIVAMENTE a partir de Matrices Vigentes y sus Evaluaciones Reales
  const irlCargosData = useMemo(() => {
    if (vigentesMatrices.length === 0) return [];

    const cargoMap = new Map<
      string,
      {
        cargo: string;
        area: string;
        matrices: IperMatrixItem[];
        lastUpdate: string;
        status: "Actualizado" | "Pendiente";
        risks: {
          task: string;
          hazard: string;
          riskEvent: string;
          controls: string;
          matrixCode: string;
          matrixName: string;
          area: string;
        }[];
      }
    >();

    vigentesMatrices.forEach((mat) => {
      const evals = mat.evaluations || (mat as any).hazards || [];
      evals.forEach((ev: IperEvaluationRow) => {
        const rawCargo = ev.cargo;
        if (!rawCargo || typeof rawCargo !== "string" || !rawCargo.trim()) return;

        // Si vienen múltiples cargos asociados (separados por coma, punto y coma o barra)
        const cargosList = rawCargo
          .split(/[,/;•]/)
          .map((c) => c.trim())
          .filter(Boolean);

        cargosList.forEach((cargoName) => {
          const key = cargoName.toLowerCase();
          const existing = cargoMap.get(key);

          const riskItem = {
            task: ev.task || "Tarea no especificada",
            hazard: ev.hazard || "Peligro no especificado",
            riskEvent: ev.riskEvent || "Riesgo no especificado",
            controls: ev.controls || "Medidas de control según procedimiento",
            matrixCode: mat.code,
            matrixName: mat.name || mat.title || "Matriz IPER",
            area: ev.area || mat.areaName || (mat as any).area || "Operaciones",
          };

          if (!existing) {
            cargoMap.set(key, {
              cargo: cargoName,
              area: ev.area || mat.areaName || (mat as any).area || "Operaciones",
              matrices: [mat],
              lastUpdate: mat.lastReviewDate || (mat as any).lastReview || "Reciente",
              status: "Actualizado",
              risks: [riskItem],
            });
          } else {
            if (!existing.matrices.some((m) => m.id === mat.id)) {
              existing.matrices.push(mat);
            }
            // Consolidar riesgos evitando duplicados exactos (mismo peligro + evento + tarea)
            const isDuplicate = existing.risks.some(
              (r) =>
                r.hazard.toLowerCase() === riskItem.hazard.toLowerCase() &&
                r.riskEvent.toLowerCase() === riskItem.riskEvent.toLowerCase() &&
                r.task.toLowerCase() === riskItem.task.toLowerCase()
            );
            if (!isDuplicate) {
              existing.risks.push(riskItem);
            }
          }
        });
      });
    });

    return Array.from(cargoMap.values()).sort((a, b) => a.cargo.localeCompare(b.cargo));
  }, [vigentesMatrices]);

  const irlMetrics = useMemo(() => {
    const total = irlCargosData.length;
    const updated = irlCargosData.filter((i) => i.status === "Actualizado").length;
    const pending = total - updated;
    const latestDate = vigentesMatrices.length > 0 ? (vigentesMatrices[0].lastReviewDate || "Hoy") : "Sin matrices vigentes";

    return { total, updated, pending, latestDate };
  }, [irlCargosData, vigentesMatrices]);

  // Apertura controlada de creación de matrices (Req 11)
  const handleOpenNewMatrix = () => {
    if (!isMiperConfigured) {
      setMethodologyPromptMessage(
        "Antes de crear tu primera Matriz IPER debes definir cómo evaluará los riesgos tu organización."
      );
      setIsMethodologyModalExplicitOpen(true);
      return;
    }
    if (areas.length === 0) {
      if (onNavigateToOrg) onNavigateToOrg();
      return;
    }
    setIsNewMatrixOpen(true);
  };

  // Edit Data Modal State
  const [isEditDataOpen, setIsEditDataOpen] = useState(false);
  const [editingMatrix, setEditingMatrix] = useState<IperMatrixItem | null>(null);
  const [editFormName, setEditFormName] = useState("");
  const [editFormWorkCenter, setEditFormWorkCenter] = useState("");
  const [editFormResponsible, setEditFormResponsible] = useState("");
  const [editFormCode, setEditFormCode] = useState("");

  // Version History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryMatrix, setSelectedHistoryMatrix] = useState<IperMatrixItem | null>(null);

  // Observations Modal State
  const [isObservationsOpen, setIsObservationsOpen] = useState(false);
  const [isAddObservationOpen, setIsAddObservationOpen] = useState(false);
  const [selectedObservationMatrix, setSelectedObservationMatrix] = useState<IperMatrixItem | null>(null);
  const [newObservationText, setNewObservationText] = useState("");

  // Modification Request Modal State
  const [isModRequestOpen, setIsModRequestOpen] = useState(false);
  const [isCreateModRequestOpen, setIsCreateModRequestOpen] = useState(false);
  const [selectedModificationMatrix, setSelectedModificationMatrix] = useState<IperMatrixItem | null>(null);
  const [newModReason, setNewModReason] = useState("");

  // Delete Confirmation Modal State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [matrixToDelete, setMatrixToDelete] = useState<IperMatrixItem | null>(null);

  // New Matrix Form State (Jerárquica según Reqs 9-14)
  const [matrixScope, setMatrixScope] = useState<"work_center" | "area" | "process">("work_center");
  const [selectedWorkCenterId, setSelectedWorkCenterId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newResponsible, setNewResponsible] = useState(currentUser?.name || "Prevencionista de Riesgos");
  const [isCustomName, setIsCustomName] = useState(false);

  // Import State (Req 8)
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importErrorsList, setImportErrorsList] = useState<string[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  // Auto-selección y dependencias de selectores para nueva matriz
  useEffect(() => {
    if (workCenters.length > 0 && !selectedWorkCenterId) {
      setSelectedWorkCenterId(workCenters[0].id);
    }
  }, [workCenters, selectedWorkCenterId]);

  useEffect(() => {
    const availableAreas = areas.filter(
      (a) => !a.workCenterId || a.workCenterId === selectedWorkCenterId
    );
    if (availableAreas.length > 0) {
      if (!availableAreas.some((a) => a.id === selectedAreaId)) {
        setSelectedAreaId(availableAreas[0].id);
      }
    } else if (areas.length > 0) {
      setSelectedAreaId(areas[0].id);
    } else {
      setSelectedAreaId("");
    }
  }, [selectedWorkCenterId, areas, selectedAreaId]);

  useEffect(() => {
    const currentArea = areas.find((a) => a.id === selectedAreaId);
    const availableProcs = (currentArea?.processes || []).filter((p) => p.status !== "Inactivo");
    if (availableProcs.length > 0) {
      if (!availableProcs.some((p) => p.id === selectedProcessId)) {
        setSelectedProcessId("");
      }
    } else {
      setSelectedProcessId("");
    }
  }, [selectedAreaId, areas, selectedProcessId]);

  const currentWcObj = workCenters.find((w) => w.id === selectedWorkCenterId) || (workCenters.length > 0 ? workCenters[0] : null);
  const currentAreaObj = areas.find((a) => a.id === selectedAreaId) || (areas.length > 0 ? areas[0] : null);
  const currentProcObj = currentAreaObj?.processes?.find((p) => p.id === selectedProcessId) || (currentAreaObj?.processes && currentAreaObj.processes.length > 0 ? currentAreaObj.processes[0] : null);

  const currentWcName = currentWcObj?.name || preferences.organizationName || "Centro de Trabajo Principal";
  const currentAreaName = currentAreaObj?.name || "Área Operativa";
  const currentProcName = currentProcObj?.name || "Proceso Operativo";

  // Nombres sugeridos que SIEMPRE comienzan con "Matriz de..."
  const suggestedNames = useMemo(() => {
    if (matrixScope === "work_center") {
      return [
        `Matriz de Riesgos ${currentWcName}`,
        `Matriz de Gestión de Riesgos ${currentWcName}`,
        `Matriz de ${currentWcName}`,
      ];
    }
    if (matrixScope === "area") {
      return [
        `Matriz de Riesgos Área ${currentAreaName}`,
        `Matriz de ${currentAreaName} - ${currentWcName}`,
        `Matriz de Gestión de Riesgos Área ${currentAreaName}`,
      ];
    }
    return [
      `Matriz de Riesgos ${currentProcName}`,
      `Matriz de ${currentProcName} - ${currentAreaName}`,
      `Matriz de Gestión de Riesgos Proceso ${currentProcName}`,
    ];
  }, [matrixScope, currentWcName, currentAreaName, currentProcName]);

  // Close floating menu on scroll or resize
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeMenuId) {
        setActiveMenuId(null);
        setMenuPosition(null);
      }
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [activeMenuId]);

  // Show Toast Notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Status Updater with Notification
  const updateMatrixStatus = (id: string, newStatus: MatrixStatus, feedbackMsg: string) => {
    const updated = matrices.map((m) => {
      if (m.id === id || (m.id && id && (m.id.endsWith(id) || id.endsWith(m.id)))) {
        return {
          ...m,
          status: newStatus,
          isExpired: newStatus === "Vencida" || newStatus === "Rechazada",
        };
      }
      return m;
    });
    updateAndPersistMatrices(updated);
    showToast(feedbackMsg);
  };

  // Copy Link Handler
  const handleCopyLink = (mat: IperMatrixItem) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard?matrix=${mat.code}`
        : `https://lifeon.cl/matrices/${mat.code}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showToast(`Enlace de ${mat.code} copiado al portapapeles`);
      })
      .catch(() => {
        showToast(`Enlace de ${mat.code} copiado con éxito`);
      });
  };

  // Export PDF/XLSX Handler
  const handleExport = (mat: IperMatrixItem, isDraft: boolean) => {
    showToast(
      isDraft
        ? `Generando borrador descargable de ${mat.code} en XLSX/PDF...`
        : `Exportando matriz ${mat.code} en XLSX/PDF...`
    );
  };

  // Open Edit Metadata Modal
  const handleOpenEditModal = (mat: IperMatrixItem) => {
    setEditingMatrix(mat);
    setEditFormCode(mat.code);
    setEditFormName(mat.name);
    setEditFormWorkCenter(mat.workCenter);
    setEditFormResponsible(mat.responsible);
    setIsEditDataOpen(true);
  };

  // Save Edit Metadata
  const handleSaveEditData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatrix) return;
    const cleanName = editFormName.trim();
    const cleanWc = editFormWorkCenter.trim();
    const cleanResp = editFormResponsible.trim();
    const cleanCode = editFormCode.trim();

    const updated = matrices.map((m) =>
      m.id === editingMatrix.id ||
      (m.id && editingMatrix.id && (m.id.endsWith(editingMatrix.id) || editingMatrix.id.endsWith(m.id)))
        ? {
            ...m,
            code: cleanCode,
            name: cleanName,
            title: cleanName,
            workCenter: cleanWc,
            workCenterName: cleanWc,
            responsible: cleanResp,
          }
        : m
    );
    updateAndPersistMatrices(updated);
    setIsEditDataOpen(false);
    showToast(`Datos de matriz ${cleanCode} actualizados y guardados.`);
  };

  // Delete Matrix
  const handleConfirmDelete = () => {
    if (!matrixToDelete) return;
    const toDeleteId = matrixToDelete.id;
    const updated = matrices.filter(
      (m) =>
        m.id !== toDeleteId &&
        !(m.id && toDeleteId && (m.id.endsWith(toDeleteId) || toDeleteId.endsWith(m.id)))
    );
    updateAndPersistMatrices(updated);
    deleteIperMatrixFromSupabase(toDeleteId, orgId);
    setIsDeleteConfirmOpen(false);
    showToast(`Matriz ${matrixToDelete.code} eliminada.`);
    setMatrixToDelete(null);
  };

  // Submit Observation
  const handleSubmitObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObservationMatrix || !newObservationText.trim()) return;
    updateMatrixStatus(
      selectedObservationMatrix.id,
      "Observada",
      `Observación registrada en ${selectedObservationMatrix.code}. Estado cambiado a Observada.`
    );
    setIsAddObservationOpen(false);
    setNewObservationText("");
  };

  // Submit Update Request
  const handleSubmitUpdateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModificationMatrix || !newModReason.trim()) return;
    updateMatrixStatus(
      selectedModificationMatrix.id,
      "En actualización",
      `Solicitud de actualización enviada para ${selectedModificationMatrix.code}. Estado cambiado a En actualización.`
    );
    setIsCreateModRequestOpen(false);
    setNewModReason("");
  };

  // Toggle Action Menu with Viewport Bounds Calculation
  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, matId: string) => {
    e.stopPropagation();
    if (activeMenuId === matId) {
      setActiveMenuId(null);
      setMenuPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownEstimatedHeight = 330;
    const spaceBelow = window.innerHeight - rect.bottom;

    let top = rect.bottom + 6;
    if (spaceBelow < dropdownEstimatedHeight && rect.top > dropdownEstimatedHeight) {
      // Flip upwards if not enough room below
      top = rect.top - dropdownEstimatedHeight - 6;
    }

    setMenuPosition({
      top: Math.max(12, top),
      right: Math.max(16, window.innerWidth - rect.right),
    });
    setActiveMenuId(matId);
  };

  // Actions Generator Based on Exact State Mappings from Design
  const getMatrixActions = (mat: IperMatrixItem): MatrixActionItem[] => {
    const status = mat.status;

    const openMatrix = () => {
      setSelectedMatrix(mat);
      setOpenWizardOnSelect(false);
    };
    const openWizardForMatrix = () => {
      setSelectedMatrix(mat);
      setOpenWizardOnSelect(true);
    };
    const editData = () => handleOpenEditModal(mat);
    const copyLink = () => handleCopyLink(mat);
    const deleteMatrix = () => {
      setMatrixToDelete(mat);
      setIsDeleteConfirmOpen(true);
    };
    const exportPdfXlsx = (isDraft: boolean) => handleExport(mat, isDraft);
    const showHistory = () => {
      setSelectedHistoryMatrix(mat);
      setIsHistoryOpen(true);
    };
    const showObservations = () => {
      setSelectedObservationMatrix(mat);
      setIsObservationsOpen(true);
    };
    const observeMatrix = () => {
      setSelectedObservationMatrix(mat);
      setIsAddObservationOpen(true);
    };
    const showModificationReq = () => {
      setSelectedModificationMatrix(mat);
      setIsModRequestOpen(true);
    };
    const requestUpdate = () => {
      setSelectedModificationMatrix(mat);
      setIsCreateModRequestOpen(true);
    };
    const validateForApproval = () =>
      updateMatrixStatus(mat.id, "En aprobación", `Matriz ${mat.code} validada para aprobación.`);
    const approveAndPublish = () =>
      updateMatrixStatus(mat.id, "Vigente", `Matriz ${mat.code} aprobada y publicada exitosamente.`);
    const rejectMatrix = () =>
      updateMatrixStatus(mat.id, "Rechazada", `Matriz ${mat.code} rechazada.`);
    const revokeObservation = () =>
      updateMatrixStatus(mat.id, "En revisión", `Observación revocada en ${mat.code}. Estado: En revisión.`);
    const revokeUpdateRequest = () =>
      updateMatrixStatus(mat.id, "Vigente", `Solicitud de actualización revocada. ${mat.code} vuelve a Vigente.`);
    const revokeApprovalSubmission = () =>
      updateMatrixStatus(mat.id, "En revisión", `Envío a aprobación revocado en ${mat.code}. Estado: En revisión.`);
    const revokeRejection = () =>
      updateMatrixStatus(mat.id, "En revisión", `Rechazo revocado en ${mat.code}. Estado: En revisión.`);
    const sendToReview = () =>
      updateMatrixStatus(mat.id, "En revisión", `Matriz ${mat.code} enviada a revisión técnica.`);

    switch (status) {
      // 1. Vigente
      case "Vigente":
        return [
          { label: "Ir a la matriz", icon: LuArrowRight, action: openMatrix },
          { label: "Información de Riesgos Laborales (IRL)", icon: LuFileText, action: openMatrix },
          { label: "Solicitar actualización", icon: LuRotateCw, action: requestUpdate },
          { label: "Exportar en PDF/XLSX", icon: LuDownload, action: () => exportPdfXlsx(false) },
          { label: "Historial de versiones", icon: LuHistory, action: showHistory },
          { label: "Copiar enlace", icon: LuLink, action: copyLink },
          { label: "Eliminar", icon: LuTrash2, action: deleteMatrix, isDanger: true },
        ];

      // 2. En revisión
      case "En revisión":
        return [
          { label: "Ir a la matriz", icon: LuArrowRight, action: openMatrix },
          { label: "Validar matriz para aprobación", icon: LuCircleCheck, action: validateForApproval },
          { label: "Observar matriz", icon: LuCircleAlert, action: observeMatrix },
          { label: "Exportar borrador en PDF/XLSX", icon: LuDownload, action: () => exportPdfXlsx(true) },
          { label: "Historial de versiones", icon: LuHistory, action: showHistory },
          { label: "Copiar enlace", icon: LuLink, action: copyLink },
          { label: "Eliminar", icon: LuTrash2, action: deleteMatrix, isDanger: true },
        ];

      // 3. Borrador
      case "Borrador":
        return [
          { label: "Confeccionar con Asistente", icon: LuSparkles, action: openWizardForMatrix },
          { label: "Ir a la matriz", icon: LuArrowRight, action: openMatrix },
          { label: "Editar datos matriz", icon: LuPencil, action: editData },
          { label: "Enviar a revisión", icon: LuSend, action: sendToReview },
          { label: "Exportar borrador en PDF/XLSX", icon: LuDownload, action: () => exportPdfXlsx(true) },
          { label: "Copiar enlace", icon: LuLink, action: copyLink },
          { label: "Eliminar", icon: LuTrash2, action: deleteMatrix, isDanger: true },
        ];

      // 4. Observada / Observado
      case "Observada":
      case "Observado":
        return [
          { label: "Ir a la matriz", icon: LuArrowRight, action: openMatrix },
          { label: "Ver observaciones", icon: LuMessageSquare, action: showObservations },
          { label: "Revocar observación", icon: LuCircleX, action: revokeObservation },
          { label: "Editar datos matriz", icon: LuPencil, action: editData },
          { label: "Enviar a revisión", icon: LuSend, action: sendToReview },
          { label: "Exportar en PDF/XLSX", icon: LuDownload, action: () => exportPdfXlsx(false) },
          { label: "Copiar enlace", icon: LuLink, action: copyLink },
          { label: "Eliminar", icon: LuTrash2, action: deleteMatrix, isDanger: true },
        ];

      // 5. En actualización / En modificación
      case "En actualización":
      case "En modificación":
        return [
          { label: "Ir a la matriz", icon: LuArrowRight, action: openMatrix },
          { label: "Ver solicitud de modificación", icon: LuMessageSquare, action: showModificationReq },
          { label: "Revocar solicitud de actualización", icon: LuCircleX, action: revokeUpdateRequest },
          { label: "Editar datos matriz", icon: LuPencil, action: editData },
          { label: "Enviar a revisión", icon: LuSend, action: sendToReview },
          { label: "Exportar en PDF/XLSX", icon: LuDownload, action: () => exportPdfXlsx(false) },
          { label: "Copiar enlace", icon: LuLink, action: copyLink },
          { label: "Ver matriz", icon: LuEye, action: openMatrix },
          { label: "Eliminar", icon: LuTrash2, action: deleteMatrix, isDanger: true },
        ];

      // 6. En aprobación
      case "En aprobación":
        return [
          { label: "Ir a la matriz", icon: LuArrowRight, action: openMatrix },
          { label: "Aprobar y publicar matriz", icon: LuCircleCheck, action: approveAndPublish },
          { label: "Rechazar matriz", icon: LuCircleX, action: rejectMatrix },
          { label: "Revocar envío a aprobación", icon: LuCircleX, action: revokeApprovalSubmission },
          { label: "Exportar borrador en PDF/XLSX", icon: LuDownload, action: () => exportPdfXlsx(true) },
          { label: "Copiar enlace", icon: LuLink, action: copyLink },
          { label: "Eliminar", icon: LuTrash2, action: deleteMatrix, isDanger: true },
        ];

      // 7. Vencida / Vencido
      case "Vencida":
      case "Vencido":
        return [
          { label: "Ir a la matriz", icon: LuArrowRight, action: openMatrix },
          { label: "Solicitar actualización", icon: LuRotateCw, action: requestUpdate },
          { label: "Exportar en PDF/XLSX", icon: LuDownload, action: () => exportPdfXlsx(false) },
          { label: "Historial de versiones", icon: LuHistory, action: showHistory },
          { label: "Copiar enlace", icon: LuLink, action: copyLink },
          { label: "Eliminar", icon: LuTrash2, action: deleteMatrix, isDanger: true },
        ];

      // 8. Rechazada
      case "Rechazada":
        return [
          { label: "Ir a la matriz", icon: LuArrowRight, action: openMatrix },
          { label: "Revocar rechazo", icon: LuCircleX, action: revokeRejection },
          { label: "Exportar en PDF/XLSX", icon: LuDownload, action: () => exportPdfXlsx(false) },
          { label: "Historial de versiones", icon: LuHistory, action: showHistory },
          { label: "Copiar enlace", icon: LuLink, action: copyLink },
          { label: "Eliminar", icon: LuTrash2, action: deleteMatrix, isDanger: true },
        ];

      default:
        return [
          { label: "Ir a la matriz", icon: LuArrowRight, action: openMatrix },
          { label: "Copiar enlace", icon: LuLink, action: copyLink },
          { label: "Eliminar", icon: LuTrash2, action: deleteMatrix, isDanger: true },
        ];
    }
  };

  const handleCreateMatrix = (e?: React.FormEvent, compileImmediately = false) => {
    if (e) e.preventDefault();
    const finalName = newName.trim() || suggestedNames[0] || "Matriz de Riesgos";

    const newItem: IperMatrixItem = {
      id: `m-${Date.now()}`,
      code: newCode.trim() || `MA-00${matrices.length + 1}`,
      name: finalName,
      scope: matrixScope,
      workCenterId: selectedWorkCenterId || undefined,
      workCenter: currentWcName,
      workCenterName: currentWcName,
      areaId: matrixScope !== "work_center" ? (selectedAreaId || undefined) : undefined,
      areaName: matrixScope !== "work_center" ? currentAreaName : undefined,
      processId: matrixScope === "process" ? (selectedProcessId || undefined) : undefined,
      processName: matrixScope === "process" ? currentProcName : undefined,
      description: newDescription.trim() || undefined,
      responsible: newResponsible || "Prevencionista de Riesgos",
      totalRecords: 0,
      intolerableRisks: 0,
      expiryText: "Vencimiento: -",
      status: "Borrador",
    };

    updateAndPersistMatrices([newItem, ...matrices]);
    setIsNewMatrixOpen(false);
    setNewName("");
    setNewCode("");
    setNewDescription("");
    setIsCustomName(false);
    showToast(`Matriz ${newItem.code} creada como Borrador.`);

    if (compileImmediately) {
      setSelectedMatrix(newItem);
      setOpenWizardOnSelect(true);
    }
  };

  // Descarga de Plantilla Oficial de Matriz IPER (2 hojas: INSTRUCCIONES y MATRIZ con branding LifeOn)
  // Descarga de Plantilla Oficial de Matriz IPER (2 hojas: INSTRUCCIONES y MATRIZ con branding LifeOn)
  const downloadIperTemplateXlsx = () => {
    const wb = XLSX.utils.book_new();

    // HOJA 1: INSTRUCCIONES
    const wsInstructions = createThemedInstructionsSheet({
      title: "PLANTILLA OFICIAL DE MATRIZ IPER (DS 44 / GESTIÓN DE RIESGOS)",
      subtitle: "Estructura formal para la identificación de peligros, evaluación de riesgos iniciales/residuales y medidas de control.",
      legendNotes: [
        "La hoja 'INSTRUCCIONES' es solo informativa y no es leída durante la importación.",
        "La hoja 'MATRIZ' es la ÚNICA hoja procesada para cargar los riesgos.",
        "Zona Superior de Metadatos: Es OBLIGATORIO indicar el 'Nombre de la Matriz' en la zona superior de la hoja 'MATRIZ'.",
        "Los valores de Probabilidad y Consecuencia deben ser números entre 1 y 5 (o 1 y 3 según metodología VEP).",
      ],
      sections: [
        {
          title: "1. METADATOS PRINCIPALES DE LA MATRIZ",
          items: [
            "Nombre de la Matriz: Campo OBLIGATORIO en la zona superior de la hoja 'MATRIZ'. Define el nombre formal con el que se registrará la matriz.",
            "Tipo de Matriz, Centro de Trabajo, Área, Proceso y Código: Campos opcionales para caracterizar el alcance organizacional.",
          ],
        },
        {
          title: "2. RELACIÓN CON ESTRUCTURA ORGANIZACIONAL",
          items: [
            "Centro de Trabajo: Debe corresponder a una sede u obra registrada en tu organización.",
            "Área: Área operativa donde se ejecuta la labor evaluada.",
            "Proceso: Proceso de trabajo al que pertenece la tarea.",
            "Cargo: Cargo ocupacional expuesto al peligro identificado (indispensable para generación automática de IRL).",
          ],
        },
        {
          title: "3. EVALUACIÓN DE RIESGOS",
          items: [
            "Probabilidad Inicial: Estimación de ocurrencia antes de controles (1 a 5).",
            "Consecuencia Inicial: Severidad de las posibles lesiones o pérdidas (1 a 5).",
            "Medidas de Control Existentes: Controles de ingeniería, administrativos o EPP en terreno.",
            "Probabilidad y Consecuencia Residual: Reevaluación tras la aplicación de controles adicionales.",
          ],
        },
        {
          title: "4. RECOMENDACIONES DE LLENADO",
          items: [
            "No modifique los nombres ni el orden de las columnas de la tabla.",
            "Puede completar tantas filas como tareas y riesgos tenga su proceso.",
          ],
        },
      ],
    });

    // HOJA 2: MATRIZ
    const wsMatriz = createThemedDataSheet({
      sheetTitle: "MATRIZ IPER",
      metadata: [
        { label: "Nombre de la Matriz", value: "Matriz de Identificación de Peligros y Evaluación de Riesgos - Operaciones", mandatory: true },
        { label: "Tipo de Matriz", value: "Por Proceso", mandatory: false },
        { label: "Centro de Trabajo", value: "Obra Hospital Talca", mandatory: false },
        { label: "Área", value: "Construcción", mandatory: false },
        { label: "Proceso", value: "Montaje estructural", mandatory: false },
        { label: "Código", value: "MA-IMP-01", mandatory: false },
        { label: "Descripción", value: "Evaluación integral de tareas críticas de montaje", mandatory: false },
      ],
      columns: [
        { header: "Centro de Trabajo", key: "workCenter", mandatory: true, width: 26 },
        { header: "Área", key: "area", mandatory: true, width: 22 },
        { header: "Proceso", key: "process", mandatory: true, width: 26 },
        { header: "Subproceso", key: "subprocess", mandatory: false, width: 20 },
        { header: "Tarea", key: "task", mandatory: true, width: 38 },
        { header: "Cargo", key: "cargo", mandatory: true, width: 24 },
        { header: "Rutinaria", key: "routine", mandatory: false, width: 14 },
        { header: "Peligro / Factor de Riesgo", key: "hazard", mandatory: true, width: 38 },
        { header: "Riesgo / Evento No Deseado", key: "risk", mandatory: true, width: 38 },
        { header: "Medidas de Control Existentes", key: "controls", mandatory: true, width: 45 },
        { header: "Probabilidad Inicial", key: "initProb", mandatory: true, width: 20 },
        { header: "Consecuencia Inicial", key: "initCons", mandatory: true, width: 20 },
        { header: "Medidas de Control Adicionales", key: "addControls", mandatory: false, width: 45 },
        { header: "Probabilidad Residual", key: "resProb", mandatory: false, width: 20 },
        { header: "Consecuencia Residual", key: "resCons", mandatory: false, width: 20 },
      ],
      data: [
        {
          workCenter: "Obra Hospital Talca",
          area: "Construcción",
          process: "Montaje estructural",
          subprocess: "Montaje de vigas",
          task: "Instalación y fijación de vigas metálicas en altura",
          cargo: "Montador Estructural",
          routine: "S",
          hazard: "Trabajo sobre plataforma en altura física > 1.80m",
          risk: "Caída a distinto nivel con politraumatismo grave o fatal",
          controls: "Uso de arnés SPDC con doble cabo de vida, línea de vida certificada e inspección previa",
          initProb: 4,
          initCons: 4,
          addControls: "Red perimetral anticaídas y supervisión permanente por rigger",
          resProb: 2,
          resCons: 2,
        },
      ],
    });

    XLSX.utils.book_append_sheet(wb, wsInstructions, "INSTRUCCIONES");
    XLSX.utils.book_append_sheet(wb, wsMatriz, "MATRIZ");

    XLSX.writeFile(wb, "Plantilla_Matriz_IPER_LifeOn.xlsx");
  };

  // Procesamiento de importación de Matriz IPER (Req 8 - Transaccional con fila por fila)
  const handleProcessIperImport = () => {
    if (!importFile) {
      setImportError("Por favor selecciona un archivo .xlsx para procesar.");
      setImportErrorsList([]);
      return;
    }
    setIsProcessingImport(true);
    setImportError(null);
    setImportErrorsList([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Buscar hoja MATRIZ
        const sheetName =
          workbook.SheetNames.find((s) => s.trim().toUpperCase() === "MATRIZ") ||
          workbook.SheetNames.find((s) => s.trim().toUpperCase() !== "INSTRUCCIONES") ||
          workbook.SheetNames[0];

        if (!sheetName) {
          setImportError("El archivo no contiene hojas con datos.");
          setIsProcessingImport(false);
          return;
        }

        const ws = workbook.Sheets[sheetName];
        const parsed = parseIperWorkbookWithMetadata(ws);
        const rawRows = parsed.rows;
        const parsedMatrixName = parsed.matrixName ? parsed.matrixName.trim() : "";

        // Validación estricta del Nombre de la Matriz (Reqs 1 y 2)
        if (!parsedMatrixName) {
          setImportError("Debes indicar el nombre de la Matriz.");
          setImportErrorsList([
            "Debes indicar el nombre de la Matriz.",
            "Completa la casilla 'Nombre de la Matriz' en la zona superior de metadatos o agrega la columna 'Nombre de la Matriz'."
          ]);
          setIsProcessingImport(false);
          return;
        }

        if (rawRows.length === 0) {
          setImportError("La hoja 'MATRIZ' no contiene registros válidos para importar.");
          setIsProcessingImport(false);
          return;
        }

        // VALIDACIÓN TRANSACCIONAL DE TODAS LAS FILAS
        const errors: string[] = [];
        const validRowsData: IperEvaluationRow[] = [];

        rawRows.forEach((row: any, idx: number) => {
          const rowNum = idx + 2; // Fila real en Excel

          const wcVal = (row["centro de trabajo"] || row["centro"] || row["workcenter"] || parsed.workCenter || currentWcName || "").toString().trim();
          const areaVal = (row["area"] || row["área"] || parsed.area || "Operaciones").toString().trim();
          const procVal = (row["proceso"] || row["process"] || parsed.process || "").toString().trim();
          const taskVal = (row["tarea"] || row["task"] || "").toString().trim();
          const cargoVal = (row["cargo"] || row["puesto"] || row["jobposition"] || "").toString().trim();
          const hazardVal = (row["peligro / factor de riesgo"] || row["peligro"] || row["hazard"] || row["factor de riesgo"] || "").toString().trim();
          const riskVal = (row["riesgo / evento no deseado"] || row["riesgo"] || row["risk"] || row["evento no deseado"] || "").toString().trim();
          const controlsVal = (row["medidas de control existentes"] || row["medidas de control"] || row["controles"] || row["controls"] || "").toString().trim();
          const addControlsVal = (row["medidas de control adicionales"] || row["controles adicionales"] || row["addcontrols"] || "").toString().trim();

          const rawInitProb = row["probabilidad inicial"] ?? row["probabilidad"] ?? row["initprob"];
          const rawInitCons = row["consecuencia inicial"] ?? row["consecuencia"] ?? row["severidad inicial"] ?? row["initcons"];
          const initProb = Number(rawInitProb);
          const initCons = Number(rawInitCons);

          const rawResProb = row["probabilidad residual"] ?? row["resprob"];
          const rawResCons = row["consecuencia residual"] ?? row["rescons"];

          if (!wcVal) errors.push(`Fila ${rowNum}: Falta el 'Centro de Trabajo'.`);
          if (!areaVal) errors.push(`Fila ${rowNum}: Falta el 'Área'.`);
          if (!procVal) errors.push(`Fila ${rowNum}: Falta el 'Proceso'.`);
          if (!taskVal) errors.push(`Fila ${rowNum}: Falta la 'Tarea'.`);
          if (!cargoVal) errors.push(`Fila ${rowNum}: Falta el 'Cargo'.`);
          if (!hazardVal) errors.push(`Fila ${rowNum}: Falta el 'Peligro / Factor de Riesgo'.`);
          if (!riskVal) errors.push(`Fila ${rowNum}: Falta el 'Riesgo / Evento No Deseado'.`);
          if (!controlsVal) errors.push(`Fila ${rowNum}: Falta 'Medidas de Control Existentes'.`);

          if (isNaN(initProb) || initProb < 1 || initProb > 5) {
            errors.push(`Fila ${rowNum}: 'Probabilidad Inicial' (${rawInitProb ?? "vacía"}) debe ser un número entero entre 1 y 5.`);
          }
          if (isNaN(initCons) || initCons < 1 || initCons > 5) {
            errors.push(`Fila ${rowNum}: 'Consecuencia Inicial' (${rawInitCons ?? "vacía"}) debe ser un número entero entre 1 y 5.`);
          }

          let resProb = rawResProb !== undefined && rawResProb !== null && rawResProb !== "" ? Number(rawResProb) : Math.max(1, Math.floor((initProb || 2) / 2));
          let resCons = rawResCons !== undefined && rawResCons !== null && rawResCons !== "" ? Number(rawResCons) : Math.max(1, Math.floor((initCons || 2) / 2));

          if (rawResProb !== undefined && rawResProb !== null && rawResProb !== "") {
            if (isNaN(resProb) || resProb < 1 || resProb > 5) {
              errors.push(`Fila ${rowNum}: 'Probabilidad Residual' debe ser un número entre 1 y 5.`);
            }
          }
          if (rawResCons !== undefined && rawResCons !== null && rawResCons !== "") {
            if (isNaN(resCons) || resCons < 1 || resCons > 5) {
              errors.push(`Fila ${rowNum}: 'Consecuencia Residual' debe ser un número entre 1 y 5.`);
            }
          }

          const initScore = (isNaN(initProb) ? 1 : initProb) * (isNaN(initCons) ? 1 : initCons);
          const resScore = resProb * resCons;

          if (resScore > initScore) {
            errors.push(`Fila ${rowNum}: El riesgo residual (${resScore}) no puede superar al riesgo inicial (${initScore}).`);
          }

          if (errors.length === 0) {
            const initialLevel: "Crítico" | "Alto" | "Medio" | "Bajo" =
              initScore >= 16 ? "Crítico" : initScore >= 10 ? "Alto" : initScore >= 5 ? "Medio" : "Bajo";
            const residualLevel: "Crítico" | "Alto" | "Medio" | "Bajo" =
              resScore >= 16 ? "Crítico" : resScore >= 10 ? "Alto" : resScore >= 5 ? "Medio" : "Bajo";

            validRowsData.push({
              id: `EV-${String(idx + 1).padStart(2, "0")}`,
              process: procVal,
              task: taskVal,
              hazard: hazardVal,
              riskEvent: riskVal,
              probInitial: initProb,
              sevInitial: initCons,
              riskInitial: initScore,
              initialLevel,
              controls: addControlsVal ? `${controlsVal} • Control adicional: ${addControlsVal}` : controlsVal,
              probResidual: resProb,
              sevResidual: resCons,
              riskResidual: resScore,
              residualLevel,
              controlStatus: "Implementado",
              responsible: newResponsible || "Prevencionista de Riesgos",
              cargo: cargoVal,
              area: areaVal,
              workCenter: wcVal,
            });
          }
        });

        // Si hay errores, NO SE CREA LA MATRIZ (Transaccional)
        if (errors.length > 0) {
          setImportErrorsList(errors);
          setImportError(`Se detectaron ${errors.length} inconsistencias en la planilla. Corrige el archivo para reintentar.`);
          setIsProcessingImport(false);
          return;
        }

        const firstRow = rawRows[0];
        const workCenterVal = (parsed.workCenter || firstRow["centro de trabajo"] || firstRow["centro"] || currentWcName || "Centro Principal").toString().trim();
        const areaVal = (parsed.area || firstRow["area"] || "Operaciones").toString().trim();
        const processVal = (parsed.process || firstRow["proceso"] || "Proceso Operativo").toString().trim();

        const newMatrixCode = parsed.code || `MA-IMP-${Date.now().toString().slice(-4)}`;
        const importedMatrix: IperMatrixItem = {
          id: `m-imp-${Date.now()}`,
          code: newMatrixCode,
          name: parsedMatrixName,
          title: parsedMatrixName,
          scope: (parsed.matrixType as any) || "process",
          workCenter: workCenterVal,
          workCenterName: workCenterVal,
          areaName: areaVal,
          processName: processVal,
          responsible: newResponsible || "Prevencionista de Riesgos",
          totalRecords: validRowsData.length,
          intolerableRisks: validRowsData.filter((e) => e.initialLevel === "Crítico").length,
          expiryText: "Vencimiento: 1 año",
          status: "Borrador",
          evaluations: validRowsData,
        };

        const updatedList = [importedMatrix, ...matrices];
        updateAndPersistMatrices(updatedList);

        setIsImportOpen(false);
        setImportFile(null);
        setImportError(null);
        setImportErrorsList([]);
        setIsProcessingImport(false);
        showToast(`Matriz '${parsedMatrixName}' importada con éxito: ${validRowsData.length} evaluaciones cargadas en estado Borrador.`);
      } catch (err: any) {
        console.error("Error importando matriz:", err);
        setImportError("Error al interpretar la planilla Excel: " + (err.message || "Formato incompatible."));
        setIsProcessingImport(false);
      }
    };
    reader.onerror = () => {
      setImportError("No fue posible leer el archivo.");
      setIsProcessingImport(false);
    };
    reader.readAsArrayBuffer(importFile);
  };

  const filteredMatrices = matrices.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.workCenter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.responsible.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "Todos" ||
      m.status === statusFilter ||
      (statusFilter === "Observada" && m.status === "Observado") ||
      (statusFilter === "En actualización" && m.status === "En modificación") ||
      (statusFilter === "Vencida" && m.status === "Vencido");

    return matchesSearch && matchesStatus;
  });

  // Filtro de Riesgos de Seguridad y Emergencias (P x C / VEP)
  const filteredSafetyRisks = safetyRisks.filter((r) => {
    const matchesCategory =
      safetyCategoryFilter === "Todos" || r.category === safetyCategoryFilter;
    if (!matchesCategory) return false;

    if (activeGridScale === "3x3" && selectedCell3x3) {
      if (currentMethodology === "dynamic5x5_vep") {
        const equiv = convert5x5ToVep3x3(r.prob5x5 || 1, r.impact5x5 || 1);
        return (
          equiv.prob3x3 === selectedCell3x3.prob &&
          equiv.severidad3x3 === selectedCell3x3.severidad
        );
      }
      return (
        r.prob3x3 === selectedCell3x3.prob &&
        r.severidad3x3 === selectedCell3x3.severidad
      );
    }
    if (activeGridScale === "5x5" && selectedCell5x5) {
      return (
        r.prob5x5 === selectedCell5x5.prob &&
        r.impact5x5 === selectedCell5x5.impact
      );
    }
    return true;
  });

  // Filtro de Riesgos Protocolares (Higiénicos, Psicosociales, Musculoesqueléticos)
  const filteredProtocolRisks = protocolRisks.filter((r) => {
    return (
      protocolFamilyFilter === "Todos" || r.riskFamily === protocolFamilyFilter
    );
  });

  // Si hay una matriz seleccionada, mostrar la vista detallada de inspección y edición
  if (selectedMatrix) {
    return (
      <IperMatrixDetailView
        matrix={selectedMatrix}
        initialOpenWizard={openWizardOnSelect}
        onBack={() => {
          setSelectedMatrix(null);
          setOpenWizardOnSelect(false);
        }}
        onUpdateMatrix={(updated) => {
          const updatedList = matrices.map((m) =>
            m.id === updated.id ||
            (m.id && updated.id && (m.id.endsWith(updated.id) || updated.id.endsWith(m.id)))
              ? updated
              : m
          );
          updateAndPersistMatrices(updatedList);
          setSelectedMatrix(updated);
          showToast(`Matriz '${updated.name}' guardada correctamente.`);
        }}
        onOpenAprVirtual={onOpenAprVirtual}
      />
    );
  }

  // Calculated Counters con normalización insensible a mayúsculas
  const countVigentes = matrices.filter((m) => {
    const s = (m.status || "").toLowerCase().trim();
    return s === "vigente" || s === "aprobada" || s === "aprobado";
  }).length;
  const countRevision = matrices.filter((m) => {
    const s = (m.status || "").toLowerCase().trim();
    return (
      s === "en revisión" ||
      s === "en revision" ||
      s === "en aprobación" ||
      s === "en aprobacion" ||
      s === "en actualización" ||
      s === "en actualizacion" ||
      s === "en modificación" ||
      s === "en modificacion"
    );
  }).length;
  const countObservadas = matrices.filter((m) => {
    const s = (m.status || "").toLowerCase().trim();
    return s === "observada" || s === "observado" || s === "rechazada";
  }).length;
  const countVencidas = matrices.filter((m) => {
    const s = (m.status || "").toLowerCase().trim();
    return s === "vencida" || s === "vencido" || m.isExpired;
  }).length;

  return (
    <div className="flex flex-col gap-3 font-[family-name:var(--font-poppins)] animate-in fade-in duration-300 relative">
      {/* Toast Flotante de Notificaciones */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <LuCircleCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Menú de Acciones Flotante Desacoplado del overflow (Fixed Portal Overlay) */}
      {activeMenuId && menuPosition && (() => {
        const currentMat = matrices.find((m) => m.id === activeMenuId);
        if (!currentMat) return null;
        const actions = getMatrixActions(currentMat);

        return (
          <>
            {/* Backdrop para cerrar al hacer clic afuera */}
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(null);
                setMenuPosition(null);
              }}
            />

            {/* Tarjeta de Opciones Flotante */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed",
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
                zIndex: 50,
              }}
              className="w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 text-xs text-left animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Acciones
              </div>
              <div className="flex flex-col gap-0.5 mt-1 max-h-[380px] overflow-y-auto">
                {actions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(null);
                      setMenuPosition(null);
                      opt.action();
                    }}
                    className={clsx(
                      "w-full px-3 py-2 text-left rounded-xl flex items-center gap-2.5 transition text-xs font-medium cursor-pointer",
                      opt.isDanger
                        ? "text-red-600 hover:bg-red-50 hover:text-red-700 mt-1 border-t border-gray-100 pt-2"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <opt.icon
                      className={clsx(
                        "w-4 h-4 flex-shrink-0",
                        opt.isDanger ? "text-red-500" : "text-gray-500"
                      )}
                    />
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      })()}

      {/* 1. Encabezado MIPER */}
      <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shadow-xs flex-shrink-0">
            <LuLayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Matriz IPER</h2>
              <span className="bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {preferences.riskEvaluationMethod === "ds44"
                  ? "DS 44 / ISL"
                  : preferences.riskEvaluationMethod === "matrix5x5"
                  ? "Matriz 5 × 5"
                  : "Estándar"}
              </span>
              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {preferences.riskManagementApproach === "simplified"
                  ? "Matriz Simplificada"
                  : "Controles Críticos"}
              </span>
              {preferences.experienceLevel === "guided" && (
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Modo Guiado
                </span>
              )}
            </div>
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
            onClick={handleOpenNewMatrix}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#F04438] hover:bg-[#D92D20] shadow-xs transition cursor-pointer"
          >
            <LuPlus className="w-4 h-4" />
            Nueva Matriz
          </button>
        </div>
      </div>

      {/* ESTADO GUIADO CUANDO NO HAY ESTRUCTURA ORGANIZACIONAL (Acceso contextual según Req 12) */}
      {areas.length === 0 && (
        <section className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-gray-200 flex flex-col items-center max-w-xl mx-auto my-4 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#F04438] flex items-center justify-center mb-4">
            <LuFolderTree className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Primero configura la estructura de tu organización
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
            Para crear una Matriz IPER necesitamos conocer las áreas, procesos, subprocesos, cargos y responsables que forman parte de tu organización.
          </p>
          <button
            type="button"
            onClick={onNavigateToOrg}
            className="px-5 py-3 bg-[#F04438] hover:bg-[#D92D20] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-2"
          >
            <LuFolderTree className="w-4 h-4" />
            <span>Configurar estructura organizacional</span>
          </button>
        </section>
      )}

      {/* 🌟 1. SECCIÓN DESTACADA: INFORMACIÓN DE RIESGOS LABORALES (IRL) (Req 7: inmediatamente bajo el título) */}
      <div className="bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-cyan-50/30 border-2 border-teal-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <LuFileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full border border-teal-200">
                  Documento Principal
                </span>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  Información de Riesgos Laborales (IRL)
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-1 max-w-2xl leading-relaxed">
                Genera y consulta la información de riesgos aplicable a cada cargo a partir de las matrices IPER vigentes de tu organización.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsIrlCargoListOpen(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap self-stretch lg:self-auto justify-center"
          >
            <LuFileText className="w-4 h-4" />
            <span>Ver Información de Riesgos Laborales</span>
          </button>
        </div>

        {/* Fila de Métricas IRL */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-teal-200/60">
          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-teal-100">
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Cargos con IRL</span>
            <p className="text-xl font-black text-gray-900 mt-0.5">{irlMetrics.total}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-teal-100">
            <span className="text-[10px] text-emerald-600 font-semibold uppercase">IRL actualizados</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{irlMetrics.updated}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-teal-100">
            <span className="text-[10px] text-amber-600 font-semibold uppercase">IRL pendientes</span>
            <p className="text-xl font-black text-amber-700 mt-0.5">{irlMetrics.pending}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-teal-100">
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Última actualización</span>
            <p className="text-xs font-bold text-gray-800 mt-1.5 truncate">{irlMetrics.latestDate}</p>
          </div>
        </div>
      </div>

      {/* 2. Tarjetas KPI de Matrices (Req 7: Total, Vigentes, En revisión, Borradores, Observadas/Vencidas) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">Total matrices</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 my-0.5">{matrices.length}</p>
          <p className="text-[11px] text-gray-400">En la organización</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">Matrices vigentes</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 my-0.5">{countVigentes}</p>
          <p className="text-[11px] font-medium text-emerald-600">Operativas</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">En revisión / aprobación</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#3B82F6] my-0.5">{countRevision}</p>
          <p className="text-[11px] font-medium text-[#3B82F6]">Flujo de validación</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">Borradores</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-700 my-0.5">
            {matrices.filter((m) => m.status === "Borrador" || m.status === "No iniciado").length}
          </p>
          <p className="text-[11px] font-medium text-slate-500">En confección</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-2xs hover:shadow-xs transition col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-gray-500">Observadas / Vencidas</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#EF4444] my-0.5">{countObservadas + countVencidas}</p>
          <p className="text-[11px] font-medium text-[#EF4444]">Requieren atención</p>
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
              <option value="Observada">Observada</option>
              <option value="En actualización">En actualización</option>
              <option value="En aprobación">En aprobación</option>
              <option value="Vencida">Vencida</option>
              <option value="Rechazada">Rechazada</option>
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

            {/* Vista 3: Mapa de Clasificación de Riesgos */}
            <button
              type="button"
              onClick={() => setViewMode("significance")}
              title="Mapa de Clasificación de Riesgos"
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
            onClick={() =>
              alert(
                "Filtros avanzados disponibles:\n- Por Centro de Trabajo\n- Por Responsable\n- Por Rango de Fechas\n- Por Nivel de Riesgo"
              )
            }
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
                        onClick={(e) => handleToggleMenu(e, mat.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                        title="Acciones de la matriz"
                      >
                        <LuEllipsisVertical className="w-4 h-4" />
                      </button>
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
                          onClick={(e) => handleToggleMenu(e, mat.id)}
                          className="text-gray-400 hover:text-teal-700 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Acciones"
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
          VISTA 3: MAPA DE CLASIFICACIÓN DE RIESGOS (SEGURIDAD/EMERGENCIAS Y GRÁFICA PROTOCOLAR)
          ========================================================================= */}
      {viewMode === "significance" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Encabezado Superior con selector de Metodología Onboarding */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#F04438] flex items-center justify-center shadow-2xs">
                  <LuFlame className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  Mapa de Clasificación de Riesgos
                </h3>
                <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
                  {activeGridScale === "3x3"
                    ? "Metodología DS 44 / VEP (3 × 3)"
                    : "Metodología Matriz 5 × 5"}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {preferences.riskEvaluationMethod === "ds44" && activeGridScale === "3x3"
                    ? "✓ Selección en Onboarding: DS 44 / VEP"
                    : preferences.riskEvaluationMethod === "matrix5x5" && activeGridScale === "5x5"
                    ? "✓ Selección en Onboarding: Matriz 5×5"
                    : "Modo alternativo"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-3xl">
                El mapa clasifica exclusivamente riesgos de <strong>Seguridad y Emergencias</strong> mediante Probabilidad × Consecuencia (VEP o P×C).
                Los riesgos <strong>Higiénicos, Psicosociales y Musculoesqueléticos</strong> se evalúan en la gráfica adyacente según su metodología protocolar ministerial (Protocolo, Magnitud y Nivel).
              </p>
            </div>

            {/* Alternador de Escala (3x3 VEP vs 5x5) */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveGridScale("3x3");
                  setSelectedCell3x3(null);
                }}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                  activeGridScale === "3x3"
                    ? "bg-white text-teal-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                <span>DS 44 - VEP (3 × 3)</span>
                {preferences.riskEvaluationMethod === "ds44" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveGridScale("5x5");
                  setSelectedCell5x5(null);
                }}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                  activeGridScale === "5x5"
                    ? "bg-white text-teal-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                <span>Matriz 5 × 5</span>
                {preferences.riskEvaluationMethod === "matrix5x5" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                )}
              </button>
            </div>
          </div>

          {/* Grilla Principal de 2 Columnas */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            {/* =========================================================================
                COLUMNA 1: MAPA P x C (SEGURIDAD Y EMERGENCIAS) (7 cols)
                ========================================================================= */}
            <div className="xl:col-span-7 flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
                {/* Cabecera del Mapa */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <LuTriangleAlert className="w-4 h-4 text-teal-600" />
                      <h4 className="text-sm font-bold text-gray-900">
                        {activeGridScale === "3x3"
                          ? "Clasificación VEP 3 × 3 (Seguridad y Emergencias)"
                          : "Clasificación P × C 5 × 5 (Seguridad y Emergencias)"}
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Frecuencia / Probabilidad vs Severidad / Consecuencia
                    </p>
                  </div>

                  {/* Filtro Rápido Seguridad vs Emergencia */}
                  <div className="flex items-center gap-1">
                    {(["Todos", "Seguridad", "Emergencia"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSafetyCategoryFilter(cat)}
                        className={clsx(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer",
                          safetyCategoryFilter === cat
                            ? "bg-teal-600 text-white shadow-2xs"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Renderizado de la Grilla (3x3 VEP vs 5x5) */}
                {activeGridScale === "3x3" ? (
                  /* ======================= GRILLA 3x3 VEP ======================= */
                  <div className="flex items-center justify-center my-2">
                    <div className="flex items-center gap-3">
                      {/* Eje Y: SEVERIDAD */}
                      <div className="flex flex-col items-center justify-between h-[270px]">
                        <div className="h-full bg-slate-100/90 rounded-full px-2 py-3 flex items-center justify-center border border-slate-200/60 shadow-2xs">
                          <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            SEVERIDAD (C)
                          </span>
                        </div>
                      </div>

                      {/* Etiquetas Eje Y (4, 2, 1) */}
                      <div className="flex flex-col justify-between h-[270px] py-4 text-xs font-semibold text-gray-500 text-right pr-1">
                        <span title="Fatal / Grave">4 (Fatal / Grave)</span>
                        <span title="Moderada">2 (Media)</span>
                        <span title="Leve">1 (Leve)</span>
                      </div>

                      {/* Celdas 3x3 y Eje X */}
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-rows-3 gap-2 w-[280px] sm:w-[320px] md:w-[360px] h-[270px]">
                          {GRID_3X3_VEP.map((row, rIdx) => (
                            <div key={rIdx} className="grid grid-cols-3 gap-2">
                              {row.map((cell, cIdx) => {
                                const count = safetyRisks.filter((r) => {
                                  if (
                                    safetyCategoryFilter !== "Todos" &&
                                    r.category !== safetyCategoryFilter
                                  ) {
                                    return false;
                                  }
                                  if (currentMethodology === "dynamic5x5_vep") {
                                    const equiv = convert5x5ToVep3x3(r.prob5x5 || 1, r.impact5x5 || 1);
                                    return (
                                      equiv.prob3x3 === cell.prob &&
                                      equiv.severidad3x3 === cell.severidad
                                    );
                                  }
                                  return (
                                    r.prob3x3 === cell.prob &&
                                    r.severidad3x3 === cell.severidad
                                  );
                                }).length;

                                const isSelected =
                                  selectedCell3x3?.prob === cell.prob &&
                                  selectedCell3x3?.severidad === cell.severidad;

                                return (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() =>
                                      setSelectedCell3x3(
                                        isSelected
                                          ? null
                                          : {
                                              prob: cell.prob,
                                              severidad: cell.severidad,
                                              vep: cell.vep,
                                            }
                                      )
                                    }
                                    className={clsx(
                                      "rounded-xl flex flex-col items-center justify-center relative font-bold text-sm transition cursor-pointer shadow-2xs",
                                      cell.color === "green" &&
                                        "bg-[#4ADE80] hover:bg-[#22C55E] text-white",
                                      cell.color === "yellow" &&
                                        "bg-[#FACC15] hover:bg-[#EAB308] text-white",
                                      cell.color === "orange" &&
                                        "bg-[#FB923C] hover:bg-[#F97316] text-white",
                                      cell.color === "red" &&
                                        "bg-[#EF4444] hover:bg-[#DC2626] text-white",
                                      isSelected &&
                                        "ring-4 ring-slate-900/30 scale-105 z-10 font-black"
                                    )}
                                  >
                                    <span className="text-xs opacity-80">
                                      VEP {cell.vep}
                                    </span>
                                    <span className="text-[10px] font-semibold opacity-90">
                                      {cell.level}
                                    </span>

                                    {/* Badge con cantidad de riesgos */}
                                    {count > 0 && (
                                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-gray-800 font-black text-[10px] flex items-center justify-center shadow-md border border-gray-100">
                                        {count}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>

                        {/* Etiquetas Eje X (1, 2, 4) */}
                        <div className="grid grid-cols-3 text-center text-xs font-semibold text-gray-500 pt-1">
                          <span>1 (Baja)</span>
                          <span>2 (Media)</span>
                          <span>4 (Alta)</span>
                        </div>

                        {/* Eje X: PROBABILIDAD */}
                        <div className="bg-slate-100/90 rounded-full py-1 text-center border border-slate-200/60 shadow-2xs mt-0.5">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            PROBABILIDAD (P)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ======================= GRILLA 5x5 ======================= */
                  <div className="flex items-center justify-center my-2">
                    <div className="flex items-center gap-3">
                      {/* Eje Y: IMPACTO */}
                      <div className="flex flex-col items-center justify-between h-[280px]">
                        <div className="h-full bg-slate-100/90 rounded-full px-2 py-3 flex items-center justify-center border border-slate-200/60 shadow-2xs">
                          <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            CONSECUENCIA (C)
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
                        <div className="grid grid-rows-5 gap-1.5 w-[280px] sm:w-[320px] md:w-[360px] h-[280px]">
                          {SIGNIFICANCE_GRID.map((row, rIdx) => (
                            <div key={rIdx} className="grid grid-cols-5 gap-1.5">
                              {row.map((cell, cIdx) => {
                                const count = safetyRisks.filter(
                                  (r) =>
                                    (safetyCategoryFilter === "Todos" ||
                                      r.category === safetyCategoryFilter) &&
                                    r.prob5x5 === cell.prob &&
                                    r.impact5x5 === cell.impact
                                ).length;

                                const isSelected =
                                  selectedCell5x5?.prob === cell.prob &&
                                  selectedCell5x5?.impact === cell.impact;

                                return (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() =>
                                      setSelectedCell5x5(
                                        isSelected
                                          ? null
                                          : {
                                              prob: cell.prob,
                                              impact: cell.impact,
                                              val: cell.val,
                                            }
                                      )
                                    }
                                    className={clsx(
                                      "rounded-lg flex items-center justify-center relative font-semibold text-xs transition cursor-pointer shadow-2xs",
                                      cell.color === "green" &&
                                        "bg-[#4ADE80] hover:bg-[#22C55E] text-white",
                                      cell.color === "yellow" &&
                                        "bg-[#FACC15] hover:bg-[#EAB308] text-white",
                                      cell.color === "orange" &&
                                        "bg-[#FB923C] hover:bg-[#F97316] text-white",
                                      cell.color === "red" &&
                                        "bg-[#EF4444] hover:bg-[#DC2626] text-white",
                                      isSelected &&
                                        "ring-4 ring-slate-900/30 scale-105 z-10 font-black"
                                    )}
                                  >
                                    <span>{cell.val}</span>
                                    {count > 0 && (
                                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white text-gray-800 font-bold text-[11px] flex items-center justify-center shadow-md border border-gray-100">
                                        {count}
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

                        {/* Eje X: PROBABILIDAD */}
                        <div className="bg-slate-100/90 rounded-full py-1 text-center border border-slate-200/60 shadow-2xs mt-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            PROBABILIDAD (P)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leyenda Inferior */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs font-medium text-gray-600 flex-wrap">
                  {activeGridScale === "3x3" ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80]" />
                        <span>Bajo / Tolerable (1-2)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                        <span>Moderado (4)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FB923C]" />
                        <span>Importante (8)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                        <span>Intolerable / Crítico (16)</span>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>

              {/* Listado de Riesgos de Seguridad y Emergencias Clasificados */}
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">
                      Riesgos de Seguridad y Emergencias ({filteredSafetyRisks.length})
                    </h5>
                    <p className="text-[11px] text-gray-400">
                      {selectedCell3x3 || selectedCell5x5
                        ? "Filtrado por celda seleccionada en la cuadrícula"
                        : "Haz clic en una celda para filtrar eventos específicos"}
                    </p>
                  </div>

                  {(selectedCell3x3 || selectedCell5x5) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCell3x3(null);
                        setSelectedCell5x5(null);
                      }}
                      className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      Limpiar filtro de celda
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredSafetyRisks.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">
                      No hay eventos en esta celda evaluada.
                    </p>
                  ) : (
                    filteredSafetyRisks.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3 hover:border-teal-200 transition flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={clsx(
                                "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase",
                                item.category === "Seguridad"
                                  ? "bg-slate-200 text-slate-800"
                                  : "bg-red-100 text-red-800"
                              )}
                            >
                              {item.category}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Área: <strong className="text-gray-700">{item.area}</strong>
                            </span>
                          </div>
                          <h6 className="text-xs font-bold text-gray-900 mt-1 line-clamp-1">
                            {item.title}
                          </h6>
                          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                            Aspecto: {item.aspect}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {activeGridScale === "3x3" && currentMethodology === "dynamic5x5_vep" ? (
                            (() => {
                              const equiv = convert5x5ToVep3x3(item.prob5x5 || 1, item.impact5x5 || 1);
                              return (
                                <>
                                  <span
                                    className={clsx(
                                      "text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs inline-block",
                                      equiv.vepLevel === "Crítico" && "bg-red-600 text-white",
                                      equiv.vepLevel === "Alto" && "bg-orange-500 text-white",
                                      equiv.vepLevel === "Medio" && "bg-amber-500 text-white",
                                      equiv.vepLevel === "Bajo" && "bg-emerald-600 text-white"
                                    )}
                                  >
                                    VEP {equiv.vepScore}
                                  </span>
                                  <span className="text-[10px] text-teal-700 block mt-0.5 font-bold">
                                    {equiv.vepLevel} (5×5: {item.val5x5} pts)
                                  </span>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <span
                                className={clsx(
                                  "text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs inline-block",
                                  item.vepLevel === "Crítico" && "bg-red-600 text-white",
                                  item.vepLevel === "Alto" && "bg-orange-500 text-white",
                                  item.vepLevel === "Medio" && "bg-amber-500 text-white",
                                  item.vepLevel === "Bajo" && "bg-emerald-600 text-white"
                                )}
                              >
                                {activeGridScale === "3x3"
                                  ? `VEP ${item.vep}`
                                  : `Score ${item.val5x5}`}
                              </span>
                              <span className="text-[10px] text-gray-400 block mt-0.5 font-medium">
                                {item.vepLevel}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* =========================================================================
                COLUMNA 2: GRÁFICA PROTOCOLAR (HIGIÉNICOS, PSICOSOCIALES, MUSCULOESQUELÉTICOS) (5 cols)
                ========================================================================= */}
            <div className="xl:col-span-5 flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col gap-3.5">
                {/* Cabecera de la Gráfica Protocolar */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-2xs">
                        <LuActivity className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 tracking-tight">
                          Evaluación Protocolar (Minsal / SUSESO)
                        </h4>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          Metodología: Protocolo • Magnitud • Nivel
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Riesgos de Higiene Ocupacional, Factores Psicosociales y Ergonomía evaluados cuantitativa y cualitativamente según normativa legal.
                    </p>
                  </div>
                </div>

                {/* Resumen Gráfico / Semáforo de Riesgo Protocolar */}
                <div className="grid grid-cols-3 gap-2 bg-gray-50/70 p-2.5 rounded-xl border border-gray-200/60 text-center">
                  <div className="bg-white p-2 rounded-lg border border-red-200 shadow-2xs">
                    <span className="text-xs font-bold text-red-600 block">
                      🔴 4 Crítico
                    </span>
                    <span className="text-[10px] text-gray-500">Nivel 3 / No Aceptable</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
                    <span className="text-xs font-bold text-amber-600 block">
                      🟡 2 Medio
                    </span>
                    <span className="text-[10px] text-gray-500">Nivel 2 / Observado</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-xs font-bold text-emerald-600 block">
                      🟢 1 Bajo
                    </span>
                    <span className="text-[10px] text-gray-500">Nivel 1 / Aceptable</span>
                  </div>
                </div>

                {/* Filtros por Familia Protocolar */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {(
                    [
                      "Todos",
                      "Higiénico",
                      "Psicosocial",
                      "Musculoesquelético",
                    ] as const
                  ).map((fam) => (
                    <button
                      key={fam}
                      type="button"
                      onClick={() => setProtocolFamilyFilter(fam)}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex-shrink-0",
                        protocolFamilyFilter === fam
                          ? "bg-teal-600 text-white shadow-2xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {fam}
                    </button>
                  ))}
                </div>

                {/* Lista Gráfica de Agentes Protocolizados */}
                <div className="flex flex-col gap-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {filteredProtocolRisks.length === 0 ? (
                    <p className="text-xs text-gray-400 py-8 text-center">
                      No hay agentes protocolizados en esta familia.
                    </p>
                  ) : (
                    filteredProtocolRisks.map((agent) => {
                      const isCritico = agent.riskLevel === "Crítico";
                      const isMedio = agent.riskLevel === "Medio";

                      return (
                        <div
                          key={agent.id}
                          className={clsx(
                            "rounded-xl p-3.5 border transition flex flex-col gap-2 shadow-2xs",
                            isCritico &&
                              "bg-red-50/20 border-red-200 hover:border-red-300",
                            isMedio &&
                              "bg-amber-50/20 border-amber-200 hover:border-amber-300",
                            !isCritico &&
                              !isMedio &&
                              "bg-emerald-50/20 border-emerald-200 hover:border-emerald-300"
                          )}
                        >
                          {/* Cabecera del Agente */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={clsx(
                                    "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase",
                                    agent.riskFamily === "Musculoesquelético" &&
                                      "bg-purple-100 text-purple-800",
                                    agent.riskFamily === "Higiénico" &&
                                      "bg-blue-100 text-blue-800",
                                    agent.riskFamily === "Psicosocial" &&
                                      "bg-amber-100 text-amber-800"
                                  )}
                                >
                                  {agent.riskFamily}
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium">
                                  {agent.area}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-gray-900 mt-1">
                                {agent.title}
                              </h5>
                              <p className="text-[10px] text-gray-500 font-semibold">
                                Puesto: {agent.jobPosition}
                              </p>
                            </div>

                            {/* Semáforo de Nivel de Riesgo */}
                            <span
                              className={clsx(
                                "text-[10px] font-black px-2 py-1 rounded-lg flex-shrink-0 flex items-center gap-1 shadow-2xs",
                                isCritico && "bg-[#F04438] text-white",
                                isMedio && "bg-amber-500 text-white",
                                !isCritico && !isMedio && "bg-emerald-600 text-white"
                              )}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              Nivel {agent.riskLevel}
                            </span>
                          </div>

                          {/* Protocolo y Magnitud */}
                          <div className="bg-white/90 p-2.5 rounded-lg border border-gray-200/80 flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center justify-between text-[10px] text-teal-800 font-bold">
                              <span>📋 {agent.protocolName}</span>
                              <span className="text-gray-400 font-normal">
                                {agent.exposureType}
                              </span>
                            </div>

                            <p className="text-gray-700 leading-snug">
                              <strong className="text-gray-900">Magnitud:</strong>{" "}
                              {agent.magnitude}
                            </p>

                            <p className="text-gray-600 text-[10px] mt-0.5">
                              <strong className="text-teal-900">Medida Exigida:</strong>{" "}
                              {agent.actionRequired}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                            <span>Base: {agent.normativeBasis}</span>
                            <span>Eval: {agent.lastEvaluationDate}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: + NUEVA MATRIZ IPER (Reqs 9-14, 39)
          ========================================================================= */}
      {isNewMatrixOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewMatrixOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Nueva Matriz IPER</h3>
            <p className="text-xs text-gray-500 mb-4">
              Selecciona el alcance organizacional y define el inventario de peligros y evaluación de riesgos.
            </p>

            <form onSubmit={(e) => handleCreateMatrix(e, false)} className="flex flex-col gap-4">
              {/* 1. SELECCIÓN DEL ALCANCE DE LA MATRIZ (Req 9) */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  1. Alcance de la Matriz *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "work_center" as const, label: "Por Centro de Trabajo", icon: LuMapPin, desc: "Toda la faena/obra" },
                    { id: "area" as const, label: "Por Área", icon: LuFolderTree, desc: "Unidad funcional" },
                    { id: "process" as const, label: "Por Proceso", icon: LuActivity, desc: "Proceso operativo" },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setMatrixScope(sc.id);
                        setIsCustomName(false);
                      }}
                      className={clsx(
                        "p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between",
                        matrixScope === sc.id
                          ? "bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20 shadow-2xs font-bold"
                          : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <sc.icon className={clsx("w-3.5 h-3.5", matrixScope === sc.id ? "text-teal-600" : "text-gray-400")} />
                        <span>{sc.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-normal mt-1">{sc.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. SELECTORES DEPENDIENTES SEGÚN ALCANCE (Reqs 10-12, 14) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-3">
                {/* Selector de Centro de Trabajo (Siempre presente) */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Centro de Trabajo *
                  </label>
                  {workCenters.length > 0 ? (
                    <select
                      value={selectedWorkCenterId}
                      onChange={(e) => setSelectedWorkCenterId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      {workCenters.map((wc) => (
                        <option key={wc.id} value={wc.id}>
                          {wc.name} {wc.code ? `(${wc.code})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                      <span>No hay centros de trabajo configurados.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewMatrixOpen(false);
                          if (onNavigateToOrg) onNavigateToOrg();
                        }}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px]"
                      >
                        Ir a Estructura
                      </button>
                    </div>
                  )}
                </div>

                {/* Selector de Área (Si el alcance es Área o Proceso) */}
                {(matrixScope === "area" || matrixScope === "process") && (
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Área Perteneciente *
                    </label>
                    <select
                      value={selectedAreaId}
                      onChange={(e) => {
                        setSelectedAreaId(e.target.value);
                        setSelectedProcessId("");
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      {areas
                        .filter((a) => !a.workCenterId || a.workCenterId === selectedWorkCenterId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Selector de Proceso (Si el alcance es Proceso) */}
                {matrixScope === "process" && (
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Proceso Perteneciente *
                    </label>
                    <select
                      value={selectedProcessId}
                      onChange={(e) => setSelectedProcessId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="">[Seleccionar Proceso]</option>
                      {(currentAreaObj?.processes || [])
                        .filter((p) => p.status !== "Inactivo")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 3. SUGERENCIAS DE NOMBRE (SIEMPRE COMIENZAN CON "Matriz de...") (Reqs 10-12) */}
              <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-teal-950">
                    <LuSparkles className="w-3.5 h-3.5 text-teal-600" />
                    Propuestas de Nombre (inician con "Matriz de"):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomName(true);
                      setNewName("");
                    }}
                    className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                  >
                    Nombre personalizado
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 pt-0.5">
                  {suggestedNames.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        setNewName(sug);
                        setIsCustomName(false);
                      }}
                      className={clsx(
                        "text-xs px-3 py-2 rounded-xl border text-left transition cursor-pointer flex items-center justify-between",
                        newName === sug || (!newName && sIdx === 0 && !isCustomName)
                          ? "bg-white border-teal-600 text-teal-900 font-bold ring-1 ring-teal-500/30 shadow-2xs"
                          : "bg-white/80 hover:bg-white text-gray-700 border-teal-200"
                      )}
                    >
                      <span>{sug}</span>
                      {(newName === sug || (!newName && sIdx === 0 && !isCustomName)) && (
                        <LuCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input de Nombre Final / Personalizado */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Nombre de la Matriz *
                </label>
                <input
                  type="text"
                  required
                  placeholder={suggestedNames[0]}
                  value={newName || (!isCustomName ? suggestedNames[0] : "")}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setIsCustomName(true);
                  }}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Código y Responsable (Código es Opcional según Req 13) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Código <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={`MA-00${matrices.length + 1}`}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-mono"
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
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-medium"
                  />
                </div>
              </div>

              {/* Descripción (Opcional según Req 13) */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Descripción <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Observaciones o consideraciones específicas del alcance..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                />
              </div>

              <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-100 mt-1">
                <button
                  type="button"
                  onClick={() => setIsNewMatrixOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleCreateMatrix(e, false)}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                  >
                    Guardar Borrador
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCreateMatrix(e, true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <LuSparkles className="w-3.5 h-3.5" />
                    Crear y Confeccionar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDITAR DATOS MATRIZ
          ========================================================================= */}
      {isEditDataOpen && editingMatrix && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setIsEditDataOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <LuPencil className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Editar Datos Matriz</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Modifica la información general de la matriz IPER seleccionada.
            </p>

            <form onSubmit={handleSaveEditData} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Código</label>
                <input
                  type="text"
                  required
                  value={editFormCode}
                  onChange={(e) => setEditFormCode(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Nombre de la Matriz
                </label>
                <input
                  type="text"
                  required
                  value={editFormName}
                  onChange={(e) => setEditFormName(e.target.value)}
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
                    required
                    value={editFormWorkCenter}
                    onChange={(e) => setEditFormWorkCenter(e.target.value)}
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
                    value={editFormResponsible}
                    onChange={(e) => setEditFormResponsible(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditDataOpen(false)}
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

      {/* =========================================================================
          MODAL: HISTORIAL DE VERSIONES
          ========================================================================= */}
      {isHistoryOpen && selectedHistoryMatrix && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <LuHistory className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Historial de Versiones</h3>
                <p className="text-xs text-gray-500">
                  {selectedHistoryMatrix.code} - {selectedHistoryMatrix.name}
                </p>
              </div>
            </div>

            <div className="mt-5 relative border-l-2 border-purple-200 ml-4 pl-5 flex flex-col gap-5">
              {/* Versión Actual */}
              <div className="relative">
                <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-purple-600 border-2 border-white shadow-xs" />
                <div className="bg-[#FAF5FF] border border-purple-100 rounded-xl p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-purple-900">v1.2 (Versión actual)</span>
                    <span className="text-[11px] text-purple-700 font-medium">Hace 2 días</span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">
                    Actualización reglamentaria DS 44 y reevaluación de riesgos intolerables.
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                    <span>Editor: {selectedHistoryMatrix.responsible}</span>
                    <span>•</span>
                    <span>Estado: {selectedHistoryMatrix.status}</span>
                  </div>
                </div>
              </div>

              {/* Versión 1.1 */}
              <div className="relative">
                <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-gray-300 border-2 border-white" />
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-800">v1.1</span>
                    <span className="text-[11px] text-gray-400">15 Ene 2026</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Incorporación de nuevos controles operacionales y protocolos de emergencia.
                  </p>
                  <div className="text-[11px] text-gray-400 mt-2">
                    Aprobado por: Carlos Mora Rocha
                  </div>
                </div>
              </div>

              {/* Versión 1.0 */}
              <div className="relative">
                <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-gray-300 border-2 border-white" />
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-800">v1.0 (Publicación Inicial)</span>
                    <span className="text-[11px] text-gray-400">02 Nov 2025</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Creación y publicación oficial de la matriz del centro de trabajo.
                  </p>
                  <div className="text-[11px] text-gray-400 mt-2">
                    Creado por: Sergio A. Jara Astete
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-gray-100 mt-5">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VER OBSERVACIONES
          ========================================================================= */}
      {isObservationsOpen && selectedObservationMatrix && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setIsObservationsOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <LuMessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Observaciones Técnicas</h3>
                <p className="text-xs text-gray-500">
                  {selectedObservationMatrix.code} - {selectedObservationMatrix.name}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 my-4 max-h-[320px] overflow-y-auto pr-1">
              <div className="p-3.5 rounded-xl bg-[#FEF9C3]/50 border border-amber-200 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">
                    Falta especificar controles de polvo y sílice
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    Pendiente
                  </span>
                </div>
                <p className="text-xs text-gray-700">
                  En el área de chancado no se detalla el sistema de aspersión ni los EPP certificados para material particulado respirable.
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                  <span>Auditor: Experto en Prevención</span>
                  <span>•</span>
                  <span>18 Feb 2026</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">
                    Nivel de severidad en trabajos en altura
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Subsanada
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Se corrigió la probabilidad y severidad de caída a distinto nivel acorde al estándar corporativo.
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                  <span>Revisor Técnico</span>
                  <span>•</span>
                  <span>10 Feb 2026</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsObservationsOpen(false);
                  handleOpenEditModal(selectedObservationMatrix);
                }}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 cursor-pointer"
              >
                <LuPencil className="w-3.5 h-3.5" />
                Editar matriz para corregir
              </button>

              <button
                type="button"
                onClick={() => setIsObservationsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: INGRESAR NUEVA OBSERVACIÓN (OBSERVAR MATRIZ)
          ========================================================================= */}
      {isAddObservationOpen && selectedObservationMatrix && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setIsAddObservationOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <LuCircleAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Observar Matriz</h3>
                <p className="text-xs text-gray-500">{selectedObservationMatrix.code}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 my-2">
              Ingresa los motivos u observaciones técnicas. La matriz cambiará automáticamente al estado <strong>Observada</strong>.
            </p>

            <form onSubmit={handleSubmitObservation} className="flex flex-col gap-3.5 mt-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Detalle de la Observación
                </label>
                <textarea
                  required
                  rows={4}
                  value={newObservationText}
                  onChange={(e) => setNewObservationText(e.target.value)}
                  placeholder="Escribe aquí los puntos a corregir o complementar por el responsable..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddObservationOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Registrar Observación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VER SOLICITUD DE MODIFICACIÓN
          ========================================================================= */}
      {isModRequestOpen && selectedModificationMatrix && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setIsModRequestOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                <LuMessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Solicitud de Modificación</h3>
                <p className="text-xs text-gray-500">{selectedModificationMatrix.code}</p>
              </div>
            </div>

            <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-4 my-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-600">Solicitante:</span>
                <span className="font-bold text-gray-900">Diego Morales Vera (Jefe de Operaciones)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-600">Fecha de Solicitud:</span>
                <span className="text-gray-700">19 Feb 2026</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-600">Prioridad:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200 text-sky-900">
                  Alta
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-sky-100">
                <span className="font-semibold text-xs text-gray-700 block mb-1">Motivo:</span>
                <p className="text-xs text-gray-800 leading-relaxed">
                  Ingreso de nueva flota de camiones de alto tonelaje y modificación del flujo peatonal en patio de maniobras. Requiere actualizar mapa de peligros y controles críticos.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModRequestOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModRequestOpen(false);
                  handleOpenEditModal(selectedModificationMatrix);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer shadow-xs"
              >
                Editar Matriz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SOLICITAR ACTUALIZACIÓN DE MATRIZ
          ========================================================================= */}
      {isCreateModRequestOpen && selectedModificationMatrix && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setIsCreateModRequestOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                <LuRotateCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Solicitar Actualización</h3>
                <p className="text-xs text-gray-500">{selectedModificationMatrix.code}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 my-2">
              Envía una solicitud formal para actualizar los peligros y evaluaciones. La matriz pasará al estado <strong>En actualización</strong>.
            </p>

            <form onSubmit={handleSubmitUpdateRequest} className="flex flex-col gap-3.5 mt-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Motivo de la Actualización
                </label>
                <textarea
                  required
                  rows={4}
                  value={newModReason}
                  onChange={(e) => setNewModReason(e.target.value)}
                  placeholder="Ej: Cambio de proceso productivo, nuevo equipamiento o vencimiento reglamentario..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModRequestOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRMAR ELIMINACIÓN DE MATRIZ
          ========================================================================= */}
      {isDeleteConfirmOpen && matrixToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <LuTrash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">¿Eliminar Matriz IPER?</h3>
            <p className="text-xs text-gray-500 mb-4">
              Estás a punto de eliminar la matriz{" "}
              <strong className="text-gray-800">
                {matrixToDelete.code} - {matrixToDelete.name}
              </strong>
              . Esta acción eliminará permanentemente los registros asociados.
            </p>

            <div className="flex justify-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setMatrixToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer shadow-xs"
              >
                Eliminar Matriz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: IMPORTAR MATRIZ IPER DESDE XLSX (Req 8: Máximo 2 Hojas)
          ========================================================================= */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => {
                setIsImportOpen(false);
                setImportFile(null);
                setImportError(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                <LuFileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Importar Matriz IPER</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Carga masiva estructurada de peligros, riesgos y controles según la metodología de tu organización.
            </p>

            {/* Banner Informativo de 2 Hojas (Req 8) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 text-xs text-gray-700 flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <LuSparkles className="w-3.5 h-3.5 text-teal-600" />
                  Estructura de la Plantilla (2 Hojas):
                </span>
                <button
                  type="button"
                  onClick={downloadIperTemplateXlsx}
                  className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 rounded-lg font-bold text-[11px] transition cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <LuDownload className="w-3.5 h-3.5 text-teal-600" />
                  Descargar Plantilla XLSX
                </button>
              </div>
              <ul className="text-[11px] text-gray-600 space-y-1 list-disc pl-4">
                <li>
                  <b>Hoja 1 (INSTRUCCIONES):</b> Guía de llenado, descripción de campos y ejemplos. <i>(No se importa)</i>.
                </li>
                <li>
                  <b>Hoja 2 (MATRIZ):</b> Única hoja de datos que procesa LifeOn con Centro, Área, Proceso, Tarea, Cargo, Peligros y Evaluaciones.
                </li>
              </ul>
            </div>

            {/* Zona de Subida de Archivo */}
            <div className="border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-xl p-6 text-center bg-gray-50 flex flex-col items-center justify-center transition cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setImportFile(e.target.files[0]);
                    setImportError(null);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <LuFileSpreadsheet className="w-10 h-10 text-emerald-600 mb-2" />
              {importFile ? (
                <div className="flex flex-col items-center">
                  <p className="text-xs font-bold text-gray-900">{importFile.name}</p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                    Archivo listo para procesar ({(importFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-800">
                    Haz clic o arrastra tu archivo Excel aquí
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Formato compatible: Plantilla_Matriz_IPER_LifeOn.xlsx
                  </p>
                </>
              )}
            </div>

            {/* Mensaje de Error si aplica */}
            {importError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <LuCircleAlert className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{importError}</span>
                </div>
                {importErrorsList.length > 0 && (
                  <div className="max-h-40 overflow-y-auto mt-2 pl-6 pr-2">
                    <ul className="list-disc space-y-1 text-[11px] text-red-800">
                      {importErrorsList.slice(0, 10).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                    {importErrorsList.length > 10 && (
                      <p className="text-[10px] text-red-600 mt-1 italic">
                        ...y {importErrorsList.length - 10} inconsistencias más.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center gap-2 pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsImportOpen(false);
                  setImportFile(null);
                  setImportError(null);
                  setImportErrorsList([]);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!importFile || isProcessingImport}
                onClick={handleProcessIperImport}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {isProcessingImport ? (
                  <>
                    <LuRotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <LuUpload className="w-3.5 h-3.5" />
                    <span>Procesar e Importar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Áreas y Estructura Organizacional */}
      <OrgStructureModal
        isOpen={isOrgStructureOpen}
        onClose={() => setIsOrgStructureOpen(false)}
      />

      {/* Modal de Onboarding Inicial Exclusivo de Metodología IPER (Closable y Bloqueante según Reqs 10-11) */}
      <IperModuleOnboardingModal
        isOpen={(!isMiperConfigured && !isMethodologyModalDismissed) || isMethodologyModalExplicitOpen}
        promptMessage={methodologyPromptMessage}
        onClose={() => {
          setIsMethodologyModalDismissed(true);
          setIsMethodologyModalExplicitOpen(false);
          setMethodologyPromptMessage(undefined);
        }}
        onConfirm={(methodology) => {
          configureMiperModule(methodology);
          setIsMethodologyModalDismissed(true);
          setIsMethodologyModalExplicitOpen(false);
          setMethodologyPromptMessage(undefined);
          showToast("Metodología de evaluación de riesgos configurada correctamente.");
        }}
      />

      {/* ==================================================================== */}
      {/* MODAL: VISTA DE INFORMACIÓN DE RIESGOS LABORALES (IRL) POR CARGO (Req 16) */}
      {/* ==================================================================== */}
      {isIrlCargoListOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
            <div>
              {/* Encabezado */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <LuFileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">
                      Información de Riesgos Laborales (IRL) por Cargo
                    </h3>
                    <p className="text-xs text-gray-500">
                      Documentos preventivos generados exclusivamente a partir de matrices IPER vigentes de la organización.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIrlCargoListOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                >
                  <LuX className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Cargos o Estado Vacío */}
              {irlCargosData.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-2xl my-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <LuFileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 mb-1">
                    No existen matrices IPER en estado Vigente
                  </h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
                    La Información de Riesgos Laborales (IRL) se genera automáticamente a partir de matrices en estado <strong>Vigente</strong>. Una vez que apruebes matrices IPER, los cargos asociados aparecerán aquí disponibles para emisión.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsIrlCargoListOpen(false);
                      handleOpenNewMatrix();
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Crear primera matriz IPER
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Cargo</th>
                        <th className="py-3 px-3">Área</th>
                        <th className="py-3 px-3">Matrices asociadas</th>
                        <th className="py-3 px-3">Última actualización</th>
                        <th className="py-3 px-3">Estado</th>
                        <th className="py-3 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {irlCargosData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-teal-50/30 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-teal-500" />
                              <span className="font-bold text-gray-900">{item.cargo}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-600">{item.area}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {item.matrices.map((m) => (
                                <span
                                  key={m.id}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-700 font-mono text-[10px] rounded font-bold"
                                  title={m.name}
                                >
                                  {m.code}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-600">{item.lastUpdate}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedIrlCargoItem(item)}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                            >
                              Ver IRL
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setIsIrlCargoListOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DOCUMENTO IRL COMPLETO POR CARGO */}
      {/* ==================================================================== */}
      {selectedIrlCargoItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 flex flex-col justify-between max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div>
              {/* Barra Superior con Acciones */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <LuFileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">
                      Documento Oficial IRL
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {selectedIrlCargoItem.cargo} • {selectedIrlCargoItem.area}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <LuPrinter className="w-3.5 h-3.5 text-gray-500" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIrlCargoItem(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                  >
                    <LuX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* CUERPO DEL DOCUMENTO CORPORATIVO */}
              <div className="bg-slate-50/60 rounded-2xl p-6 sm:p-8 border border-slate-200 text-gray-900 flex flex-col gap-6 text-xs leading-relaxed">
                {/* Membrete Oficial */}
                <div className="text-center pb-4 border-b border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700">
                    LIFEON SST • GESTIÓN DE RIESGOS LABORALES
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
                    INFORMACIÓN DE RIESGOS LABORALES (IRL)
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Obligación de Informar los Riesgos Laborales (Art. 21 D.S. N° 40 / Ley 16.744 / D.S. N° 44)
                  </p>
                </div>

                {/* Cuadro de Identificación */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Empresa</span>
                    <strong className="text-gray-800 font-bold">{preferences.organizationName || "Constructora Santa María SpA"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Puesto / Cargo</span>
                    <strong className="text-teal-800 font-bold">{selectedIrlCargoItem.cargo}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Área Operativa</span>
                    <strong className="text-gray-800 font-bold">{selectedIrlCargoItem.area}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Fecha de Emisión</span>
                    <span className="text-gray-700">{selectedIrlCargoItem.lastUpdate}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Matrices IPER Vigentes Fuente</span>
                    <span className="text-gray-700 font-mono text-[11px]">
                      {selectedIrlCargoItem.matrices.map((m) => m.code).join(", ")}
                    </span>
                  </div>
                </div>

                {/* 1. Marco Legal */}
                <div>
                  <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <LuShieldCheck className="w-4 h-4 text-teal-600" />
                    1. Objetivo y Alcance
                  </h4>
                  <p className="text-gray-600 text-justify">
                    El presente documento tiene por objetivo informar oportuna y convenientemente a los trabajadores sobre los riesgos inherentes a sus labores, las medidas preventivas adoptadas por la empresa y los métodos de trabajo correctos, conforme a lo establecido en el Artículo 21 del Decreto Supremo N° 40, en concordancia con la Ley N° 16.744 y el Decreto Supremo N° 44.
                  </p>
                </div>

                {/* 2. Peligros y Medidas de Control (Consolidados de Matrices Vigentes) */}
                <div>
                  <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <LuShieldAlert className="w-4 h-4 text-amber-600" />
                    2. Peligros, Riesgos Evaluados y Medidas Preventivas Obligatorias
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-gray-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                          <th className="p-2.5 w-1/5">Tarea Evaluada</th>
                          <th className="p-2.5 w-1/4">Peligro Identificado</th>
                          <th className="p-2.5 w-1/4">Consecuencia / Evento</th>
                          <th className="p-2.5 w-1/4">Medida Preventiva / Control DS 44</th>
                          <th className="p-2.5 w-1/12 text-center">Matriz</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {selectedIrlCargoItem.risks.map((r, rIdx) => (
                          <tr key={rIdx}>
                            <td className="p-2.5 font-semibold text-gray-800">{r.task}</td>
                            <td className="p-2.5 text-gray-900">{r.hazard}</td>
                            <td className="p-2.5 text-gray-600">{r.riskEvent}</td>
                            <td className="p-2.5 text-teal-900 bg-teal-50/40">{r.controls}</td>
                            <td className="p-2.5 text-center font-mono text-[10px] text-gray-600 font-bold">{r.matrixCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. EPP Obligatorio */}
                <div>
                  <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <LuCheck className="w-4 h-4 text-emerald-600" />
                    3. Elementos de Protección Personal (EPP) Obligatorios
                  </h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-0.5 ml-1">
                    <li>Casco de seguridad dieléctrico con barbiquejo de 3 puntas.</li>
                    <li>Calzado de seguridad con puntera de acero o composite y suela antideslizante.</li>
                    <li>Lentes de seguridad con protección UV y sello hermético contra partículas.</li>
                    <li>Chaleco reflectante de alta visibilidad clase 2 o 3 según norma.</li>
                    <li>Guantes de seguridad certificados específicos para la tarea (mecánicos / nitrilo).</li>
                    <li>Protección respiratoria con filtros certificados según exposición a polvo o vapores.</li>
                  </ul>
                </div>

                {/* 4. Declaración de Recepción y Firma */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col gap-4 mt-2">
                  <p className="text-[11px] text-gray-600 text-justify">
                    Declaro haber recibido la información y capacitación sobre los riesgos propios de mis funciones como <strong>{selectedIrlCargoItem.cargo}</strong>, comprometiéndome a cumplir las normas internas, los procedimientos de trabajo seguro y el uso permanente de mis EPP.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px]">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Nombre Trabajador</span>
                      <div className="border-b border-gray-300 pt-3"></div>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">RUT</span>
                      <div className="border-b border-gray-300 pt-3"></div>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Fecha de Entrega</span>
                      <div className="border-b border-gray-300 pt-3 text-gray-700">{selectedIrlCargoItem.lastUpdate}</div>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Firma</span>
                      <div className="border-b border-gray-300 pt-3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setSelectedIrlCargoItem(null)}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
