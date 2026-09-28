import type { IperAiContextInput } from "@/types/ai";

export function buildArtpStepUserPrompt(ctx: IperAiContextInput): string {
  return [
    "Genera entre 3 y 6 PASOS SIGNIFICATIVOS secuenciales para el ARTP de la tarea indicada.",
    "Prioriza el paso actual > tarea > subproceso > proceso > área > rubro.",
    "No repitas pasos existentes.",
    `Pasos existentes: ${(ctx.existingStepNames || []).join("; ")}`,
    `Tarea: ${ctx.taskName}. Paso en edición: ${ctx.stepDescription || ""}`,
  ].join("\n");
}

export function buildArtpEnergyUserPrompt(ctx: IperAiContextInput): string {
  return [
    "Sugiere entre 2 y 5 ENERGÍAS INVOLUCRADAS (códigos: electrica, mecanica, hidraulica, neumatica, termica, quimica, gravitacional, presion, almacenada, otra).",
    "Responde JSON con suggestions[].code y suggestions[].label.",
    `Contexto paso: ${ctx.stepDescription}. Tarea: ${ctx.taskName}.`,
  ].join("\n");
}

export function buildArtpVerificationUserPrompt(ctx: IperAiContextInput): string {
  return [
    "Genera entre 2 y 4 PREGUNTAS DE VERIFICACIÓN para controles del paso (campo name = pregunta).",
    "Preguntas cerradas Sí/No, concretas y observables.",
    `Controles existentes: ${JSON.stringify(ctx.existingControls || [])}`,
    `Paso: ${ctx.stepDescription}. Tarea: ${ctx.taskName}.`,
  ].join("\n");
}

export const ARTP_STEP_SYSTEM =
  "Eres APR Virtual IA en modo sugerencias ARTP (pasos significativos). Salida JSON estricta.";

export const ARTP_ENERGY_SYSTEM =
  "Eres APR Virtual IA en modo sugerencias ARTP (energías). Salida JSON estricta.";

export const ARTP_VERIFICATION_SYSTEM =
  "Eres APR Virtual IA en modo sugerencias ARTP (preguntas de verificación). Salida JSON estricta.";
