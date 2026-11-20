export type PsPhase = "Preparación" | "Operación" | "Monitoreo y revisión";

export const PS_PHASES: PsPhase[] = ["Preparación", "Operación", "Monitoreo y revisión"];

export type PsPillarId = 1 | 2 | 3 | 4;

export interface PsPillar {
  id: PsPillarId;
  name: string;
}

export interface PsElement {
  number: number;
  pillarId: PsPillarId;
  name: string;
}

export const PS_PILLARS: PsPillar[] = [
  { id: 1, name: "Liderazgo en seguridad de procesos" },
  { id: 2, name: "Identificación y evaluación de riesgos" },
  { id: 3, name: "Gestión de riesgos" },
  { id: 4, name: "Revisión y mejora" },
];

export const PS_ELEMENTS: PsElement[] = [
  { number: 1, pillarId: 1, name: "Liderazgo, compromiso y responsabilidad" },
  { number: 2, pillarId: 1, name: "Identificación y cumplimiento de legislación y estándares" },
  { number: 3, pillarId: 1, name: "Selección, competencia y salud del personal" },
  { number: 4, pillarId: 1, name: "Participación de los trabajadores" },
  { number: 5, pillarId: 1, name: "Comunicación con partes interesadas" },
  { number: 6, pillarId: 2, name: "Identificación de peligros y evaluación de riesgos" },
  { number: 7, pillarId: 2, name: "Documentación, registros y gestión del conocimiento" },
  { number: 8, pillarId: 3, name: "Manuales y procedimientos operacionales" },
  { number: 9, pillarId: 3, name: "Monitoreo del estado del proceso y traspaso de turno" },
  { number: 10, pillarId: 3, name: "Gestión de interfaces operacionales" },
  { number: 11, pillarId: 3, name: "Estándares y prácticas" },
  { number: 12, pillarId: 3, name: "Gestión del cambio y gestión de proyectos" },
  { number: 13, pillarId: 3, name: "Preparación operacional y puesta en marcha" },
  { number: 14, pillarId: 3, name: "Preparación ante emergencias" },
  { number: 15, pillarId: 3, name: "Inspección y mantenimiento" },
  { number: 16, pillarId: 3, name: "Gestión de dispositivos críticos de seguridad" },
  { number: 17, pillarId: 3, name: "Control del trabajo, permisos y riesgo de tareas" },
  { number: 18, pillarId: 3, name: "Selección y gestión de contratistas y proveedores" },
  { number: 19, pillarId: 4, name: "Reporte e investigación de incidentes" },
  { number: 20, pillarId: 4, name: "Auditoría, aseguramiento y revisión por la dirección" },
];

export interface PsActivity {
  id: string;
  organizationId: string;
  elementNumber: number;
  phase: PsPhase;
  code: string | null;
  title: string;
  responsible: string | null;
  /** YYYY-MM-DD */
  plannedStart: string | null;
  /** YYYY-MM-DD */
  plannedEnd: string | null;
  progress: number;
  sortOrder: number;
}

export interface PsProgressLogEntry {
  activityId: string;
  progress: number;
  /** YYYY-MM-DD */
  recordedOn: string;
}

export type PsElementStatus = "No iniciado" | "Al día" | "Atrasado";

export interface PsProgressSummary {
  /** 0–100 */
  real: number;
  /** 0–100 */
  plan: number;
}

export function scopedPsId(orgId: string, suffix: string): string {
  const base = orgId.replace(/[^a-zA-Z0-9_]/g, "_");
  return `${base}_ps_${suffix}`;
}
