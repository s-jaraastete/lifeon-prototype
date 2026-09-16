import type { IperAiContextInput } from "@/types/ai";

function contextBlock(ctx: IperAiContextInput): string {
  return JSON.stringify(
    {
      workCenter: ctx.workCenterName,
      area: ctx.areaName,
      process: ctx.processName,
      subprocess: ctx.subprocessName,
      task: ctx.taskName,
      existingTasks: ctx.existingTaskNames,
    },
    null,
    0
  );
}

export function buildIperTaskUserPrompt(ctx: IperAiContextInput): string {
  return [
    "Genera entre 3 y 6 sugerencias de TAREAS operativas para la matriz IPER.",
    "Prioriza subproceso > proceso > área > rubro.",
    "No repitas tareas existentes.",
    "Responde SOLO JSON según el schema.",
    `Contexto: ${contextBlock(ctx)}`,
  ].join("\n");
}

export function buildIperHazardUserPrompt(ctx: IperAiContextInput): string {
  return [
    "Genera entre 3 y 6 PELIGROS concretos asociados a la TAREA indicada (fuente de energía/condición peligrosa).",
    "No listes un catálogo genérico del rubro sin relación con la tarea.",
    "Campo name = descripción del peligro; no confundir con el evento de daño (riesgo).",
    `Contexto: ${JSON.stringify({ task: ctx.taskName, process: ctx.processName, subprocess: ctx.subprocessName, area: ctx.areaName })}`,
  ].join("\n");
}

export function buildIperRiskUserPrompt(ctx: IperAiContextInput): string {
  const hazards = ctx.hazards?.map((h) => h.name).join("; ");
  return [
    "Genera entre 3 y 6 RIESGOS (eventos/consecuencias de daño) coherentes con la tarea y peligros dados.",
    "No repitas el peligro como si fuera riesgo.",
    `Tarea: ${ctx.taskName}. Peligros: ${hazards}.`,
    `Evita duplicar: ${(ctx.existingRiskNames || []).join(", ")}`,
  ].join("\n");
}

export function buildIperControlUserPrompt(ctx: IperAiContextInput): string {
  return [
    "Genera entre 3 y 6 CONTROLES sugeridos para revisión profesional.",
    "Usa la jerarquía: Eliminar/Sustituir, Ingeniería, Administrativos, EPP.",
    "No dupliques controles ya existentes.",
    `Contexto: ${JSON.stringify({
      task: ctx.taskName,
      hazards: ctx.hazards?.map((h) => h.name),
      risks: ctx.risks?.map((r) => r.name),
      existingControls: ctx.existingControls,
    })}`,
  ].join("\n");
}

export const IPER_TASK_SYSTEM =
  "Eres APR Virtual IA en modo sugerencias IPER (tareas). Salida JSON estricta. Sugerencias orientativas.";

export const IPER_HAZARD_SYSTEM =
  "Eres APR Virtual IA en modo sugerencias IPER (peligros). Salida JSON estricta.";

export const IPER_RISK_SYSTEM =
  "Eres APR Virtual IA en modo sugerencias IPER (riesgos/eventos). Salida JSON estricta.";

export const IPER_CONTROL_SYSTEM =
  "Eres APR Virtual IA en modo sugerencias IPER (controles). Salida JSON estricta.";
