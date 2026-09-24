export const IRL_LEGAL_BADGE = "D.S. N° 44";

export const IRL_LEGAL_SUBTITLE =
  "En cumplimiento de la obligación de informar los riesgos laborales establecida en el Decreto Supremo N° 44 (Gestión de Riesgos en el trabajo) y la Ley N° 16.744.";

export const IRL_OBLIGATION_TITLE =
  "Obligación de Informar los Riesgos Laborales (D.S. N° 44):";

export const IRL_OBLIGATION_BODY =
  "La empresa informa oportunamente al trabajador sobre los peligros que entrañan sus labores asignadas, los riesgos específicos a los que estará expuesto, las consecuencias para su salud y las medidas preventivas, métodos correctos de trabajo y EPP obligatorios que debe cumplir rigurosamente.";

export const IRL_WORKER_DECLARATION_INTRO =
  "Declaro haber recibido, leído y comprendido la presente Información de Riesgos Laborales (IRL) correspondiente a mi cargo de";

export const IRL_WORKER_DECLARATION_OUTRO =
  "Me comprometo a cumplir estrictamente con los procedimientos de trabajo seguro, el uso permanente y adecuado de mis Elementos de Protección Personal (EPP), y a informar inmediatamente cualquier condición o acto subestándar a mi jefatura directa.";

export function buildIrlDocumentCode(matrixCode: string, cargoName: string): string {
  const prefix = cargoName.trim().slice(0, 3).toUpperCase() || "IRL";
  return `IRL-${matrixCode}-${prefix}`;
}

export function consequencesForIrlLevel(level?: string): string {
  switch (level) {
    case "Crítico":
      return "Muerte, invalidez total, traumatismo severo, atrapamiento.";
    case "Alto":
      return "Fracturas, quemaduras graves, daño musculoesquelético o auditivo.";
    default:
      return "Contusiones, cortes menores, fatiga o irritación temporal.";
  }
}

export type IrlEvaluationLike = {
  id?: string;
  task?: string;
  process?: string;
  hazard?: string;
  riskEvent?: string;
  initialLevel?: string;
  controls?: string;
};

export type IrlDocumentSnapshot = {
  kind: "irl";
  matrixId?: string;
  matrixCode?: string;
  matrixTitle?: string;
  workCenterName?: string;
  cargoName?: string;
  responsible?: string;
  organizationName?: string;
  organizationLogoUrl?: string | null;
  documentCode?: string;
  issuedAt?: string;
  assigneeFullName?: string;
  assigneeIdentificationNumber?: string | null;
  evaluations?: IrlEvaluationLike[];
};

export function parseIrlSnapshot(raw: Record<string, unknown>): IrlDocumentSnapshot {
  return {
    kind: "irl",
    matrixId: raw.matrixId != null ? String(raw.matrixId) : undefined,
    matrixCode: raw.matrixCode != null ? String(raw.matrixCode) : undefined,
    matrixTitle: raw.matrixTitle != null ? String(raw.matrixTitle) : undefined,
    workCenterName: raw.workCenterName != null ? String(raw.workCenterName) : undefined,
    cargoName: raw.cargoName != null ? String(raw.cargoName) : undefined,
    responsible: raw.responsible != null ? String(raw.responsible) : undefined,
    organizationName: raw.organizationName != null ? String(raw.organizationName) : undefined,
    organizationLogoUrl:
      raw.organizationLogoUrl != null ? String(raw.organizationLogoUrl) : null,
    documentCode: raw.documentCode != null ? String(raw.documentCode) : undefined,
    issuedAt: raw.issuedAt != null ? String(raw.issuedAt) : undefined,
    assigneeFullName:
      raw.assigneeFullName != null ? String(raw.assigneeFullName) : undefined,
    assigneeIdentificationNumber:
      raw.assigneeIdentificationNumber != null
        ? String(raw.assigneeIdentificationNumber)
        : null,
    evaluations: Array.isArray(raw.evaluations)
      ? (raw.evaluations as IrlEvaluationLike[])
      : [],
  };
}
