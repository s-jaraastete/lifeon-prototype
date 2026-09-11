export type ExperienceLevel = "guided" | "intermediate" | "expert";
export type GuidanceLevel = "high" | "contextual" | "minimal";
export type RiskEvaluationMethod = "ds44" | "matrix5x5" | "pending";
export type RiskManagementApproach = "iper" | "critical_controls" | "simplified";
export type OrganizationSize = "1-20" | "21-50" | "51-200" | "201-500" | "500+";

export type IperMethodology = "vep3x3" | "matrix5x5" | "dynamic5x5_vep" | "pending";

export interface IperModuleConfig {
  configured: boolean;
  methodology: IperMethodology;
  confirmed: boolean;
  configuredAt?: string | null;
}

export interface PreventivePlanningModuleConfig {
  configured: boolean;
  hasExistingProgram: boolean | null;
  setupMode: "upload_existing" | "create_base" | null;
  configuredAt?: string | null;
}

export interface OrganizationModuleConfigurations {
  miper: IperModuleConfig;
  preventivePlanning: PreventivePlanningModuleConfig;
}

export interface ModulePreferences {
  miper: boolean;
  documentManagement: boolean;
  aprVirtual: boolean;
}

export interface OrganizationPreferences {
  organizationName: string;
  organizationSize: OrganizationSize | string;
  organizationSector: string;
  experienceLevel: ExperienceLevel;
  guidanceLevel: GuidanceLevel;
  riskEvaluationMethod: RiskEvaluationMethod;
  riskManagementApproach: RiskManagementApproach;
  modules: ModulePreferences;
  moduleConfigurations?: OrganizationModuleConfigurations;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string | null;
  onboardingStep: number;
  tourCompleted?: boolean;
  organizationLogo?: string | null;
  profilePhoto?: string | null;
  preventiveActivities?: any[];
}

export const DEFAULT_MODULE_CONFIGURATIONS: OrganizationModuleConfigurations = {
  miper: {
    configured: true,
    methodology: "dynamic5x5_vep",
    confirmed: true,
    configuredAt: new Date().toISOString(),
  },
  preventivePlanning: {
    configured: true,
    hasExistingProgram: true,
    setupMode: "upload_existing",
    configuredAt: new Date().toISOString(),
  },
};

export const DEFAULT_ORGANIZATION_PREFERENCES: OrganizationPreferences = {
  organizationName: "Constructora y Servicios Santiago SpA",
  organizationSize: "51-200",
  organizationSector: "Construcción",
  experienceLevel: "guided",
  guidanceLevel: "high",
  riskEvaluationMethod: "ds44",
  riskManagementApproach: "iper",
  modules: {
    miper: true,
    documentManagement: true,
    aprVirtual: true,
  },
  moduleConfigurations: DEFAULT_MODULE_CONFIGURATIONS,
  onboardingCompleted: false,
  onboardingCompletedAt: null,
  onboardingStep: 1,
  tourCompleted: false,
  organizationLogo: null,
  profilePhoto: null,
};

export const EMPTY_ORGANIZATION_PREFERENCES: OrganizationPreferences = {
  organizationName: "",
  organizationSize: "",
  organizationSector: "",
  experienceLevel: "guided",
  guidanceLevel: "high",
  riskEvaluationMethod: "pending",
  riskManagementApproach: "iper",
  modules: {
    miper: true,
    documentManagement: true,
    aprVirtual: true,
  },
  moduleConfigurations: {
    miper: {
      configured: false,
      methodology: "pending",
      confirmed: false,
      configuredAt: null,
    },
    preventivePlanning: {
      configured: false,
      hasExistingProgram: null,
      setupMode: null,
      configuredAt: null,
    },
  },
  onboardingCompleted: false,
  onboardingCompletedAt: null,
  onboardingStep: 1,
  tourCompleted: false,
  organizationLogo: null,
  profilePhoto: null,
};

export interface TerminologyDictionary {
  probability: string;
  probabilityQuestion: string;
  consequence: string;
  consequenceQuestion: string;
  residualRisk: string;
  preventiveControl: string;
  mitigatingControl: string;
  criticalControl: string;
  hierarchyTitle: string;
}

export const TERMINOLOGY_MAP: Record<ExperienceLevel, TerminologyDictionary> = {
  expert: {
    probability: "Probabilidad",
    probabilityQuestion: "Frecuencia o probabilidad técnica del suceso iniciador",
    consequence: "Consecuencia / Severidad",
    consequenceQuestion: "Nivel de severidad potencial del daño a la salud o integridad",
    residualRisk: "Riesgo Residual",
    preventiveControl: "Control Preventivo",
    mitigatingControl: "Control Mitigador",
    criticalControl: "Control Crítico (CC)",
    hierarchyTitle: "Jerarquía de Controles de Seguridad",
  },
  intermediate: {
    probability: "Probabilidad de Ocurrencia",
    probabilityQuestion: "Estimación de la probabilidad de que ocurra el evento",
    consequence: "Gravedad del Daño",
    consequenceQuestion: "Estimación de la gravedad o daño potencial si ocurre",
    residualRisk: "Riesgo con Medidas Aplicadas",
    preventiveControl: "Medida Preventiva",
    mitigatingControl: "Medida Mitigadora",
    criticalControl: "Control Clave Prioritario",
    hierarchyTitle: "Jerarquía de Medidas de Prevención",
  },
  guided: {
    probability: "¿Qué tan probable es que ocurra?",
    probabilityQuestion: "¿Con qué frecuencia o posibilidad podría presentarse este peligro?",
    consequence: "¿Qué tan graves podrían ser las consecuencias?",
    consequenceQuestion: "¿Qué tan grave podría resultar si ocurre un accidente?",
    residualRisk: "Nivel de riesgo final tras aplicar las medidas",
    preventiveControl: "¿Qué podemos hacer para evitar que ocurra?",
    mitigatingControl: "¿Cómo reducimos el impacto si llega a ocurrir?",
    criticalControl: "Medida crítica indispensable para salvar vidas",
    hierarchyTitle: "Pasos recomendados para controlar el riesgo",
  },
};

export function getTermLabels(level: ExperienceLevel): TerminologyDictionary {
  return TERMINOLOGY_MAP[level] || TERMINOLOGY_MAP.guided;
}
