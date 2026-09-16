import type { DashboardMenuKey } from "@/types/dashboardNav";

export type AprChatMode = "apr_chat" | "module_assistant";

export type IperSuggestionKind = "task" | "hazard" | "risk" | "control";

export interface AiChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface AiUiContext {
  module: DashboardMenuKey;
  currentStep?: string;
  workCenterName?: string;
  areaName?: string;
  processName?: string;
  subprocessName?: string;
  positionName?: string;
  taskName?: string;
  hazardName?: string;
  riskName?: string;
}

export interface IperAiContextInput {
  workCenterName?: string;
  areaName?: string;
  processName?: string;
  subprocessName?: string;
  taskName?: string;
  hazards?: { name: string }[];
  risks?: { name: string }[];
  existingTaskNames?: string[];
  existingHazardNames?: string[];
  existingRiskNames?: string[];
  existingControls?: { type: string; description: string }[];
}

export interface TaskSuggestionItem {
  name: string;
  reason: string;
}

export interface HazardSuggestionItem {
  name: string;
  reason: string;
  classification?: "Seguridad" | "Emergencias" | "Higiénicos" | "Psicosociales" | "Músculo-esquelético";
}

export interface RiskSuggestionItem {
  name: string;
  reason: string;
  family?: string;
}

export type ControlSuggestionType =
  | "Eliminar / Sustituir"
  | "Controles de Ingeniería"
  | "Controles Administrativos"
  | "Elementos de Protección Personal (EPP)";

export interface ControlSuggestionItem {
  type: ControlSuggestionType;
  description: string;
  reason: string;
  isCritical?: boolean;
}

export interface AiSuggestionsResponse {
  source: "ai" | "cache";
  suggestions: TaskSuggestionItem[] | HazardSuggestionItem[] | RiskSuggestionItem[] | ControlSuggestionItem[];
  disclaimer: string;
}

export interface AiClientErrorBody {
  code?: string;
  message?: string;
}

export interface TechnicalDocSectionSpec {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

export interface TechnicalDocGenerateRequest {
  documentType: string;
  documentName: string;
  sections: TechnicalDocSectionSpec[];
}

export interface TechnicalDocGenerateResponse {
  sections: Record<string, string>;
  disclaimer: string;
}
