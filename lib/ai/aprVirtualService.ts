import "server-only";

import type {
  AiChatHistoryItem,
  AiSuggestionsResponse,
  AiUiContext,
  AprChatMode,
  IperAiContextInput,
  IperSuggestionKind,
} from "@/types/ai";
import type { LifeOnSessionPayload } from "@/lib/auth/lifeonSession";
import { AI_LIMITS } from "@/lib/ai/config";
import {
  buildOrgContextSummary,
  prepareIperContext,
  prepareUiContext,
  trimChatHistory,
  trimUserMessage,
} from "@/lib/ai/contextBuilder";
import { loadOrganizationPreferencesForSession } from "@/lib/ai/orgContext";
import { assertAiRateLimit } from "@/lib/ai/rateLimit";
import {
  buildSuggestionCacheKey,
  getCachedSuggestions,
  setCachedSuggestions,
} from "@/lib/ai/suggestionCache";
import { getAIProvider } from "@/lib/ai/provider";
import type { ChatMessage } from "@/lib/ai/provider/types";
import { buildBaseSystemPrompt } from "@/lib/ai/prompts/base";
import { buildAprChatSystemAddon } from "@/lib/ai/prompts/aprChat";
import { buildModuleAssistantSystemAddon } from "@/lib/ai/prompts/moduleAssistant";
import {
  buildIperControlUserPrompt,
  buildIperHazardUserPrompt,
  buildIperRiskUserPrompt,
  buildIperTaskUserPrompt,
  IPER_CONTROL_SYSTEM,
  IPER_HAZARD_SYSTEM,
  IPER_RISK_SYSTEM,
  IPER_TASK_SYSTEM,
} from "@/lib/ai/prompts/iperSuggestions";
import {
  CONTROL_JSON_SCHEMA,
  HAZARD_JSON_SCHEMA,
  parseSuggestionsByKind,
  RISK_JSON_SCHEMA,
  TASK_JSON_SCHEMA,
} from "@/lib/ai/schemas/suggestions";
import { AiServiceError } from "@/lib/ai/errors";
import { getTermLabels } from "@/types/preferences";
import type { TechnicalDocGenerateResponse, TechnicalDocSectionSpec } from "@/types/ai";
import {
  buildTechnicalDocJsonSchema,
  parseTechnicalDocSections,
} from "@/lib/ai/schemas/technicalDoc";
import {
  buildTechnicalDocUserPrompt,
  TECHNICAL_DOC_SYSTEM,
} from "@/lib/ai/prompts/technicalDoc";

const DISCLAIMER = "Sugerencias de APR Virtual IA para revisión profesional.";
const TECH_DOC_DISCLAIMER =
  "Borrador generado por APR Virtual IA. Debes revisarlo, completar datos faltantes y aprobarlo antes de darlo por vigente.";

function validateIperContext(kind: IperSuggestionKind, ctx: IperAiContextInput): void {
  switch (kind) {
    case "task":
      if (!ctx.areaName?.trim() || !ctx.processName?.trim()) {
        throw new AiServiceError("CONTEXT_INCOMPLETE", "Se requieren área y proceso.", 400);
      }
      break;
    case "hazard":
      if (!ctx.taskName?.trim()) {
        throw new AiServiceError("CONTEXT_INCOMPLETE", "Se requiere una tarea.", 400);
      }
      break;
    case "risk":
      if (!ctx.taskName?.trim() || !ctx.hazards?.length) {
        throw new AiServiceError("CONTEXT_INCOMPLETE", "Se requiere tarea y peligros.", 400);
      }
      break;
    case "control":
      if (!ctx.taskName?.trim() || !ctx.hazards?.length || !ctx.risks?.length) {
        throw new AiServiceError(
          "CONTEXT_INCOMPLETE",
          "Se requiere tarea, peligro y riesgo.",
          400
        );
      }
      break;
  }
}

export async function streamAprVirtualChat(params: {
  session: LifeOnSessionPayload;
  mode: AprChatMode;
  message: string;
  history: AiChatHistoryItem[];
  uiContext: AiUiContext;
}): Promise<AsyncIterable<string>> {
  await assertAiRateLimit(params.session.orgId, params.session.userId);

  const prefs = await loadOrganizationPreferencesForSession(params.session.orgId);
  const ui = prepareUiContext(params.uiContext);
  const userMessage = trimUserMessage(params.message);
  if (!userMessage) {
    throw new AiServiceError("INVALID_REQUEST", "Mensaje vacío.", 400);
  }

  let system = buildBaseSystemPrompt(prefs);
  system +=
    params.mode === "apr_chat"
      ? `\n${buildAprChatSystemAddon()}`
      : `\n${buildModuleAssistantSystemAddon(ui)}`;

  const orgSummary = buildOrgContextSummary(prefs);
  system += `\nContexto organizacional: ${JSON.stringify(orgSummary)}`;
  if (ui.module !== "apr") {
    system += `\nContexto UI: ${JSON.stringify(ui)}`;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...trimChatHistory(params.history).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: userMessage },
  ];

  const provider = getAIProvider();
  return provider.streamChat({
    messages,
    maxTokens: AI_LIMITS.maxChatOutputTokens,
    temperature: AI_LIMITS.chatTemperature,
  });
}

export async function generateIperSuggestions(params: {
  session: LifeOnSessionPayload;
  kind: IperSuggestionKind;
  iperContext: IperAiContextInput;
}): Promise<AiSuggestionsResponse> {
  const ctx = prepareIperContext(params.iperContext);
  validateIperContext(params.kind, ctx);

  const cacheKey = buildSuggestionCacheKey(params.session.orgId, params.kind, ctx);
  const cached = await getCachedSuggestions(cacheKey);
  if (cached) {
    return { ...cached, source: "cache" };
  }

  await assertAiRateLimit(params.session.orgId, params.session.userId);

  const prefs = await loadOrganizationPreferencesForSession(params.session.orgId);
  const terminology = getTermLabels(prefs.experienceLevel);

  let systemAddon = buildBaseSystemPrompt(prefs);
  let userPrompt = "";
  let schemaName = "task_suggestions";
  let jsonSchema: Record<string, unknown> = TASK_JSON_SCHEMA as unknown as Record<string, unknown>;

  switch (params.kind) {
    case "task":
      systemAddon += `\n${IPER_TASK_SYSTEM}`;
      userPrompt = buildIperTaskUserPrompt(ctx);
      schemaName = "task_suggestions";
      jsonSchema = TASK_JSON_SCHEMA as unknown as Record<string, unknown>;
      break;
    case "hazard":
      systemAddon += `\n${IPER_HAZARD_SYSTEM}`;
      userPrompt = buildIperHazardUserPrompt(ctx);
      schemaName = "hazard_suggestions";
      jsonSchema = HAZARD_JSON_SCHEMA as unknown as Record<string, unknown>;
      break;
    case "risk":
      systemAddon += `\n${IPER_RISK_SYSTEM}`;
      userPrompt = buildIperRiskUserPrompt(ctx);
      schemaName = "risk_suggestions";
      jsonSchema = RISK_JSON_SCHEMA as unknown as Record<string, unknown>;
      break;
    case "control":
      systemAddon += `\n${IPER_CONTROL_SYSTEM}`;
      systemAddon += `\nTerminología controles: ${JSON.stringify(terminology)}`;
      userPrompt = buildIperControlUserPrompt(ctx);
      schemaName = "control_suggestions";
      jsonSchema = CONTROL_JSON_SCHEMA as unknown as Record<string, unknown>;
      break;
  }

  const provider = getAIProvider();
  const raw = await provider.generateStructured<unknown>({
    messages: [
      { role: "system", content: systemAddon },
      { role: "user", content: userPrompt },
    ],
    schemaName,
    jsonSchema,
    maxTokens: AI_LIMITS.maxSuggestionOutputTokens,
    temperature: AI_LIMITS.suggestionTemperature,
  });

  const suggestions = parseSuggestionsByKind(params.kind, raw);
  const response: AiSuggestionsResponse = {
    source: "ai",
    suggestions,
    disclaimer: DISCLAIMER,
  };

  await setCachedSuggestions(cacheKey, params.session.orgId, response);
  return response;
}

export async function generateTechnicalDocumentContent(params: {
  session: LifeOnSessionPayload;
  documentType: string;
  documentName: string;
  sections: TechnicalDocSectionSpec[];
}): Promise<TechnicalDocGenerateResponse> {
  const sectionKeys = params.sections.map((s) => s.key).filter(Boolean);
  if (sectionKeys.length === 0) {
    throw new AiServiceError("INVALID_REQUEST", "Sin secciones válidas.", 400);
  }

  await assertAiRateLimit(params.session.orgId, params.session.userId);

  const prefs = await loadOrganizationPreferencesForSession(params.session.orgId);
  const system = `${buildBaseSystemPrompt(prefs)}\n${TECHNICAL_DOC_SYSTEM}`;
  const userPrompt = buildTechnicalDocUserPrompt({
    documentType: params.documentType,
    documentName: params.documentName,
    sections: params.sections,
    prefs,
  });

  const jsonSchema = buildTechnicalDocJsonSchema(sectionKeys);
  const provider = getAIProvider();
  const raw = await provider.generateStructured<unknown>({
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    schemaName: "technical_document_sections",
    jsonSchema: jsonSchema as unknown as Record<string, unknown>,
    maxTokens: AI_LIMITS.maxTechnicalDocOutputTokens,
    temperature: AI_LIMITS.suggestionTemperature,
  });

  const sections = parseTechnicalDocSections(sectionKeys, raw);
  return {
    sections,
    disclaimer: TECH_DOC_DISCLAIMER,
  };
}
