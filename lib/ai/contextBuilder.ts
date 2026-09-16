import "server-only";

import type { AiChatHistoryItem, AiUiContext, IperAiContextInput } from "@/types/ai";
import type { OrganizationPreferences } from "@/types/preferences";
import { AI_LIMITS } from "@/lib/ai/config";
import { sanitizeAIContextUi, sanitizeIperContext } from "@/lib/ai/sanitizeAIContext";

export function trimChatHistory(history: AiChatHistoryItem[]): AiChatHistoryItem[] {
  return history
    .slice(-AI_LIMITS.maxHistoryMessages)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, AI_LIMITS.maxHistoryContentChars),
    }));
}

export function trimUserMessage(message: string): string {
  return message.trim().slice(0, AI_LIMITS.maxMessageChars);
}

export function buildOrgContextSummary(prefs: OrganizationPreferences): Record<string, string> {
  return {
    organizationSector: prefs.organizationSector || "",
    organizationName: prefs.organizationName || "",
    experienceLevel: prefs.experienceLevel,
    guidanceLevel: prefs.guidanceLevel,
    riskManagementApproach: prefs.riskManagementApproach,
  };
}

export function prepareUiContext(ui: AiUiContext): AiUiContext {
  return sanitizeAIContextUi(ui);
}

export function prepareIperContext(input: IperAiContextInput): IperAiContextInput {
  return sanitizeIperContext(input);
}
