export type PersistenceErrorKind =
  | "config"
  | "rls"
  | "network"
  | "validation"
  | "storage"
  | "unknown";

export interface PersistenceError {
  kind: PersistenceErrorKind;
  message: string;
  raw?: string;
}

export function classifySupabaseError(error: unknown): PersistenceError {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: string }).message)
      : String(error ?? "Error desconocido");

  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  const lower = message.toLowerCase();

  if (code === "PGRST301" || lower.includes("row-level security") || lower.includes("rls")) {
    return { kind: "rls", message: "No tienes permiso para esta operación.", raw: message };
  }
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("failed to fetch")) {
    return { kind: "network", message: "Error de conexión con el servidor.", raw: message };
  }
  if (code.startsWith("23") || lower.includes("violates") || lower.includes("invalid")) {
    return { kind: "validation", message: "Los datos no cumplen las reglas de la base de datos.", raw: message };
  }
  if (lower.includes("storage") || lower.includes("bucket")) {
    return { kind: "storage", message: "Error al subir o leer archivos.", raw: message };
  }

  return { kind: "unknown", message: "No se pudo completar la operación.", raw: message };
}

export function logPersistenceError(context: string, error: unknown): PersistenceError {
  const classified = classifySupabaseError(error);
  const payload = { context, kind: classified.kind, raw: classified.raw };
  if (classified.kind === "rls") {
    console.warn("[LifeOn persistence]", payload);
  } else if (classified.kind === "config") {
    console.warn("[LifeOn persistence]", payload);
  } else {
    console.warn("[LifeOn persistence]", payload);
  }
  return classified;
}
