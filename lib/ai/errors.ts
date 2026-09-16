export type AiErrorCode =
  | "AI_BUSY"
  | "AI_DAILY_LIMIT"
  | "AI_UNAVAILABLE"
  | "CONTEXT_INCOMPLETE"
  | "UNAUTHORIZED"
  | "INVALID_REQUEST";

export class AiServiceError extends Error {
  readonly code: AiErrorCode;
  readonly status: number;

  constructor(code: AiErrorCode, message: string, status: number) {
    super(message);
    this.name = "AiServiceError";
    this.code = code;
    this.status = status;
  }
}

export function mapGroqErrorToAiError(err: unknown): AiServiceError {
  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : 503;

  if (status === 429) {
    return new AiServiceError(
      "AI_BUSY",
      "APR Virtual está temporalmente ocupado. Intenta nuevamente en unos momentos.",
      429
    );
  }

  return new AiServiceError(
    "AI_UNAVAILABLE",
    "APR Virtual no está disponible en este momento. Puedes continuar de forma manual.",
    503
  );
}

export const AI_USER_MESSAGES: Record<AiErrorCode, string> = {
  AI_BUSY: "APR Virtual está temporalmente ocupado. Intenta nuevamente en unos momentos.",
  AI_DAILY_LIMIT:
    "Se alcanzó el límite diario de consultas de APR Virtual. Intenta mañana o continúa de forma manual.",
  AI_UNAVAILABLE:
    "APR Virtual no está disponible en este momento. Puedes continuar de forma manual.",
  CONTEXT_INCOMPLETE: "Completa el contexto requerido antes de generar sugerencias.",
  UNAUTHORIZED: "Inicia sesión nuevamente para usar APR Virtual IA.",
  INVALID_REQUEST: "No se pudo procesar la solicitud.",
};
