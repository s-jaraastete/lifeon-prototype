const AUTH_MESSAGES: Record<string, string> = {
  "invalid login credentials": "Email o contraseña incorrectos.",
  "email not confirmed": "Confirma tu email antes de iniciar sesión.",
};

export function translateSupabaseMessage(message: string): string | null {
  const lower = message.trim().toLowerCase();

  for (const [key, text] of Object.entries(AUTH_MESSAGES)) {
    if (lower.includes(key)) return text;
  }

  if (lower.includes("document_deliveries") && lower.includes("schema cache")) {
    return "Los documentos asignados aún no están activos en el servidor. Tu administrador debe aplicar la migración de entregas.";
  }

  if (lower.includes("could not find the table")) {
    return "Esta función aún no está disponible en la base de datos. Intenta más tarde o contacta a soporte.";
  }

  if (lower.includes("permission denied") || lower.includes("row-level security")) {
    return "No tienes permiso para acceder a estos datos.";
  }

  if (lower.includes("jwt expired") || lower.includes("invalid jwt")) {
    return "Tu sesión expiró. Vuelve a iniciar sesión.";
  }

  return null;
}

export function toUserFacingError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  return translateSupabaseMessage(error.message) ?? fallback;
}
