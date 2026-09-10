export type ActivityStatus = "Pendiente" | "En curso" | "Cumplida" | "Atrasada";

export type ActivityPeriodicity =
  | "Una vez"
  | "Mensual"
  | "Trimestral"
  | "Semestral"
  | "Anual"
  | "Según necesidad"
  | "Otra"
  | "Única vez"
  | "Bimestral";

export type ActivityApplicability =
  | "Base"
  | "Obligatoria"
  | "Recomendada"
  | "Según aplicabilidad"
  | "Según corresponda"
  | "Aplicabilidad por revisar";

export type ActivityCategory =
  | "Planificación y Gestión"
  | "Gestión de Riesgos"
  | "Información de Riesgos Laborales (IRL)"
  | "Capacitación y Difusión"
  | "Reglamentación (RIOHS)"
  | "Emergencias y Evacuación"
  | "Vigilancia y Salud Ocupacional"
  | "Gestión de Incidentes"
  | "Participación y CPHS"
  | "Inspecciones y Verificaciones"
  | "Documentación y Registros"
  | "Cierre y Evaluación Anual"
  | "Inspecciones y Observaciones"
  | "Comité Paritario y Liderazgo"
  | "Protocolos Minsal"
  | "Emergencias y Simulacros"
  | "Mantenimiento Preventivo"
  | "Gestión de Contratistas"
  | "Otra Actividad";

export interface ActivityEvidence {
  id: string;
  name: string;
  type: "Documento" | "Fotografía" | "Registro" | "Certificado" | "Informe" | "Otro";
  uploadedAt: string;
  fileSize?: string;
  url?: string;
}

export interface ProgramActivity {
  id: string;
  code?: string;
  name: string;
  description: string;
  objective?: string;
  category: ActivityCategory;
  areaId?: string;
  areaName?: string;
  responsibleUserId?: string;
  responsibleUserName?: string;
  responsiblePositionId?: string;
  responsiblePositionName?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  periodicity: ActivityPeriodicity;
  applicability?: ActivityApplicability;
  status: ActivityStatus;
  progress: number;  // 0 - 100
  evidences: ActivityEvidence[];
  observations?: string;
}

export interface PreventiveProgramMetrics {
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  pendingActivities: number;
  overdueActivities: number;
  upcomingActivities: number;
  compliancePercentage: number;
  byCategory: Record<string, { total: number; completed: number; inProgress: number; pending: number; overdue: number }>;
  byArea: Record<string, { total: number; completed: number; percentage: number }>;
  byResponsible: Record<string, { total: number; completed: number; percentage: number }>;
}
