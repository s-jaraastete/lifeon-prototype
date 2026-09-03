export type DocCategory =
  | "Programa Anual SST"
  | "Reglamento Interno"
  | "Plan de Emergencia"
  | "Procedimiento PTS"
  | "Protocolo Minsal"
  | "Registro Obligatorio";

export type DocStatus =
  | "Vigente"
  | "Por Vencer"
  | "Vencido"
  | "En Revisión"
  | "Pendiente de Carga";

export type AuditStatus =
  | "Conforme"
  | "Con Observaciones"
  | "No Conforme"
  | "Sin Auditar";

export type AuditPointStatus = "Cumple" | "Observado" | "No Cumple" | "No Aplica";

export interface AuditPoint {
  id: string;
  code: string;
  requirement: string;
  normativeReference: string;
  criticality: "Crítico" | "Mayor" | "Menor";
  status: AuditPointStatus;
  notes?: string;
  lastAuditedDate?: string;
}

export interface DocSection {
  id: string;
  title: string;
  content: string;
}

export interface PreventiveDoc {
  id: string;
  code: string;
  title: string;
  category: DocCategory;
  regulatoryBasis: string;
  version: string;
  status: DocStatus;
  author: string;
  approver?: string;
  issueDate: string; // DD-MM-YYYY or YYYY-MM-DD
  expiryDate: string; // DD-MM-YYYY or YYYY-MM-DD
  daysRemaining?: number;
  source: "Plantilla del Sistema" | "Cargado por Empresa" | "Generado con IA";
  hasFile: boolean;
  fileName?: string;
  fileSize?: string;
  contentSections: DocSection[];
  auditChecklist: AuditPoint[];
  auditScore: number; // 0 - 100
  auditStatus: AuditStatus;
}

/**
 * Calcula los días restantes para el vencimiento de una fecha dada en formato DD-MM-YYYY o YYYY-MM-DD
 */
export function calculateDaysRemaining(expiryDateStr: string): number {
  if (!expiryDateStr || expiryDateStr === "Indefinido") return 999;
  
  let expiry: Date;
  if (expiryDateStr.includes("-")) {
    const parts = expiryDateStr.split("-");
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      expiry = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      // DD-MM-YYYY
      expiry = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
  } else {
    expiry = new Date(expiryDateStr);
  }

  if (isNaN(expiry.getTime())) return 999;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determina el estado de vigencia automático según la fecha de expiración
 */
export function getAutoVigenciaStatus(expiryDateStr: string, currentStatus?: DocStatus): {
  status: DocStatus;
  daysRemaining: number;
} {
  if (currentStatus === "Pendiente de Carga" || currentStatus === "En Revisión") {
    return { status: currentStatus, daysRemaining: 0 };
  }

  const days = calculateDaysRemaining(expiryDateStr);
  if (days < 0) {
    return { status: "Vencido", daysRemaining: days };
  }
  if (days <= 30) {
    return { status: "Por Vencer", daysRemaining: days };
  }
  return { status: "Vigente", daysRemaining: days };
}
