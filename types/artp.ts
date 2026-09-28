export type ArtpVersionStatus = "borrador" | "en_revision" | "vigente" | "archivado";

export type ArtpExecutionStatus = "pendiente" | "en_ejecucion" | "detenida" | "completada";

export type ArtpControlType =
  | "Eliminar / Sustituir"
  | "Controles de Ingeniería"
  | "Controles Administrativos"
  | "Elementos de Protección Personal (EPP)";

export type ArtpCheckAnswer = "si" | "no" | "no_aplica";

export type ArtpChangeCategory = "personas" | "entorno" | "herramientas";

export type OrgTaskOrigin = "manual" | "iper" | "artp";

export interface EnergyType {
  id: string;
  code: string;
  label: string;
  organizationId: string | null;
  isSystem: boolean;
}

export interface OrgTask {
  id: string;
  organizationId: string;
  name: string;
  normalizedName: string;
  description?: string;
  workCenterId?: string;
  areaId?: string;
  processId?: string;
  subprocessId?: string;
  origin: OrgTaskOrigin;
  iperMatrixId?: string;
  iperTaskLabel?: string;
}

export interface ArtpDocumentListItem {
  id: string;
  organizationId: string;
  name: string;
  code?: string;
  description?: string;
  orgTaskId: string;
  taskName: string;
  workCenterId?: string;
  areaId?: string;
  processId?: string;
  currentVersionId?: string;
  versionNumber?: number;
  versionStatus?: ArtpVersionStatus;
  updatedAt: string;
}

export interface ArtpStepControl {
  id: string;
  description: string;
  controlType: ArtpControlType;
  isCritical: boolean;
  verificationQuestion?: string;
  /** Respuesta planificada Sí/No a la pregunta clave del control */
  verificationAnswer?: ArtpCheckAnswer | null;
}

export interface ArtpStepEvent {
  id: string;
  name: string;
  controls: ArtpStepControl[];
}

export interface ArtpStepRisk {
  id: string;
  name: string;
  controls: ArtpStepControl[];
}

export interface ArtpStepHazard {
  id: string;
  name: string;
  classification?: string;
  risks: ArtpStepRisk[];
}

export interface ArtpStep {
  id: string;
  sequence: number;
  description: string;
  tools: string[];
  energyTypeIds: string[];
  /** Modelo metodológico ARTP: eventos no deseados por paso */
  events?: ArtpStepEvent[];
  /** Persistencia legacy / snapshot */
  hazards: ArtpStepHazard[];
}

export interface ArtpWorkContext {
  workDate: string;
  startTime: string;
  endTime: string;
  specificLocation: string;
  workArea: string;
  supervisorMemberId?: string;
  supervisorName: string;
  supervisorSignatureDataUrl?: string | null;
  signatureStoragePath?: string | null;
}

export interface ArtpChangeAnswer {
  questionId: string;
  category: ArtpChangeCategory;
  question: string;
  answer: boolean | null;
  changeDescription?: string;
  undesiredEvent?: string;
  additionalControl?: string;
  implementationVerified?: boolean | null;
}

export interface ArtpWorkerSignature {
  id: string;
  memberId?: string;
  workerName: string;
  signatureDataUrl?: string | null;
  signatureStoragePath?: string | null;
}

export interface ArtpPlanningBundle {
  taskName: string;
  iperMatrixId?: string;
  workContext: ArtpWorkContext;
  changeAnswers: ArtpChangeAnswer[];
  workers: ArtpWorkerSignature[];
  /** Respuestas Sí/No planificadas por control (id control → respuesta) */
  controlAnswers?: Record<string, ArtpCheckAnswer>;
}

export interface ArtpVersionDetail {
  document: {
    id: string;
    name: string;
    code?: string;
    description?: string;
  };
  version: {
    id: string;
    versionNumber: number;
    status: ArtpVersionStatus;
    taskName: string;
    contentHash?: string;
    publishedAt?: string;
  };
  positionIds: string[];
  steps: ArtpStep[];
  planning?: ArtpPlanningBundle;
  contentSnapshot?: Record<string, unknown>;
}

export interface ArtpExecutionSummary {
  id: string;
  code: string;
  status: ArtpExecutionStatus;
  artpVersionId: string;
  documentName?: string;
  taskName?: string;
  specificLocation?: string;
  startsOn?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface ArtpHomeCounts {
  vigente: number;
  borrador: number;
  enRevision: number;
  executionsPendiente: number;
  executionsCompletada: number;
}

export interface ArtpWizardDraft {
  documentId?: string;
  versionId?: string;
  name: string;
  code?: string;
  description?: string;
  workCenterId?: string;
  areaId?: string;
  processId?: string;
  subprocessId?: string;
  orgTaskId?: string;
  taskName: string;
  positionIds: string[];
  steps: ArtpStep[];
}

export interface ArtpIperLinkRow {
  id: string;
  orgTaskId: string;
  artpDocumentId: string;
  iperMatrixId: string;
  taskLabel: string;
  status: "vinculada" | "propuesta_pendiente";
  proposedRows: unknown[];
}

export const ARTp_CONTROL_TYPES: ArtpControlType[] = [
  "Eliminar / Sustituir",
  "Controles de Ingeniería",
  "Controles Administrativos",
  "Elementos de Protección Personal (EPP)",
];

export function normalizeTaskName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function scopedArtpId(orgId: string, suffix: string): string {
  const base = orgId.replace(/[^a-zA-Z0-9_]/g, "_");
  return `${base}_artp_${suffix}`;
}
