import type { IperAiContextInput, AiUiContext } from "@/types/ai";

const SENSITIVE_KEY =
  /^(email|rut|dni|passport|phone|telefono|token|password|avatar|userid|orgid|organizationid)$/i;

export function sanitizeString(value: string | undefined | null, max = 500): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim().slice(0, max);
}

export function sanitizeAIContextUi(ui: AiUiContext): AiUiContext {
  return {
    module: ui.module,
    currentStep: sanitizeString(ui.currentStep, 80),
    workCenterName: sanitizeString(ui.workCenterName),
    areaName: sanitizeString(ui.areaName),
    processName: sanitizeString(ui.processName),
    subprocessName: sanitizeString(ui.subprocessName),
    positionName: sanitizeString(ui.positionName),
    taskName: sanitizeString(ui.taskName),
    hazardName: sanitizeString(ui.hazardName),
    riskName: sanitizeString(ui.riskName),
  };
}

export function sanitizeIperContext(input: IperAiContextInput): IperAiContextInput {
  const trimList = (items?: { name: string }[]) =>
    items
      ?.map((i) => sanitizeString(i.name, 200))
      .filter(Boolean)
      .map((name) => ({ name: name! }))
      .slice(0, 20);

  return {
    workCenterName: sanitizeString(input.workCenterName),
    areaName: sanitizeString(input.areaName),
    processName: sanitizeString(input.processName),
    subprocessName: sanitizeString(input.subprocessName),
    taskName: sanitizeString(input.taskName),
    hazards: trimList(input.hazards),
    risks: trimList(input.risks),
    existingTaskNames: input.existingTaskNames
      ?.map((n) => sanitizeString(n, 200))
      .filter(Boolean) as string[] | undefined,
    existingHazardNames: input.existingHazardNames
      ?.map((n) => sanitizeString(n, 200))
      .filter(Boolean) as string[] | undefined,
    existingRiskNames: input.existingRiskNames
      ?.map((n) => sanitizeString(n, 200))
      .filter(Boolean) as string[] | undefined,
    existingControls: input.existingControls
      ?.map((c) => ({
        type: sanitizeString(c.type, 80) || "",
        description: sanitizeString(c.description, 300) || "",
      }))
      .filter((c) => c.description)
      .slice(0, 30),
  };
}

/** Elimina claves sensibles de objetos planos antes de serializar a prompt. */
export function stripSensitiveKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEY.test(key)) continue;
    out[key] = val;
  }
  return out;
}
