"use client";

import { useState, useEffect } from "react";
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
} from "react-icons/lu";
import IperMatrixDetailView from "./IperMatrixDetailView";

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

const INITIAL_MATRICES: IperMatrixItem[] = [
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

export default function IperMatrixView({ onOpenAprVirtual }: { onOpenAprVirtual?: () => void }) {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "significance">("grid");
  const [matrices, setMatrices] = useState<IperMatrixItem[]>(INITIAL_MATRICES);
  const [impacts, setImpacts] = useState<SignificanceImpactItem[]>(INITIAL_IMPACTS);
  const [selectedMatrix, setSelectedMatrix] = useState<IperMatrixItem | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selectedCell, setSelectedCell] = useState<{ prob: number; impact: number; val: number } | null>(null);

  // Modals and Active Dropdown State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [isNewMatrixOpen, setIsNewMatrixOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // New Matrix Form State
  const [newCode, setNewCode] = useState(`MA-00${matrices.length + 1}`);
  const [newName, setNewName] = useState("");
  const [newWorkCenter, setNewWorkCenter] = useState("Planta Quilicura");
  const [newResponsible, setNewResponsible] = useState("Sergio A. Jara Astete");

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
    setMatrices((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            status: newStatus,
            isExpired: newStatus === "Vencida" || newStatus === "Rechazada",
          };
        }
        return m;
      })
    );
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
    setMatrices((prev) =>
      prev.map((m) =>
        m.id === editingMatrix.id
          ? {
              ...m,
              code: editFormCode,
              name: editFormName,
              workCenter: editFormWorkCenter,
              responsible: editFormResponsible,
            }
          : m
      )
    );
    setIsEditDataOpen(false);
    showToast(`Datos de matriz ${editFormCode} actualizados.`);
  };

  // Delete Matrix
  const handleConfirmDelete = () => {
    if (!matrixToDelete) return;
    setMatrices((prev) => prev.filter((m) => m.id !== matrixToDelete.id));
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

    const openMatrix = () => setSelectedMatrix(mat);
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

      // 3. Borrador / No iniciado
      case "Borrador":
      case "No iniciado":
        return [
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
      status: "Borrador",
    };

    setMatrices([newItem, ...matrices]);
    setIsNewMatrixOpen(false);
    setNewName("");
    showToast(`Matriz ${newItem.code} creada como Borrador.`);
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

  // Calculated Counters
  const countVigentes = matrices.filter((m) => m.status === "Vigente").length;
  const countRevision = matrices.filter((m) =>
    ["En revisión", "En aprobación", "En actualización", "En modificación"].includes(m.status)
  ).length;
  const countObservadas = matrices.filter((m) =>
    ["Observada", "Observado", "Rechazada"].includes(m.status)
  ).length;
  const countVencidas = matrices.filter(
    (m) => ["Vencida", "Vencido"].includes(m.status) || m.isExpired
  ).length;

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
          <p className="text-3xl font-bold text-gray-900 my-0.5">{countVigentes}</p>
          <p className="text-[11px] text-gray-400">de {matrices.length} totales</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">En revisión / aprobación</p>
          <p className="text-3xl font-bold text-[#3B82F6] my-0.5">{countRevision}</p>
          <p className="text-[11px] font-medium text-[#3B82F6]">Flujo de validación</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">Observadas / Rechazadas</p>
          <p className="text-3xl font-bold text-[#D97706] my-0.5">{countObservadas}</p>
          <p className="text-[11px] font-medium text-[#D97706]">Requieren atención</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-2xs hover:shadow-xs transition">
          <p className="text-xs font-medium text-gray-500">Matrices vencidas</p>
          <p className="text-3xl font-bold text-[#EF4444] my-0.5">{countVencidas}</p>
          <p className="text-[11px] font-medium text-[#EF4444]">Actualización obligatoria</p>
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
                  showToast("Matriz importada con éxito desde archivo XLSX.");
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
