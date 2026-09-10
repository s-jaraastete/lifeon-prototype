export interface AuthUser {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName: string;
  isDemo: boolean;
}

export const DEMO_USER: AuthUser = {
  id: "demo_sergio",
  name: "Sergio A. Jara Astete",
  email: "sergio.jara@lifeon.cl",
  orgId: "org_demo",
  orgName: "Constructora y Servicios Santiago SpA",
  isDemo: true,
};

export const LUIS_USER: AuthUser = {
  id: "user_luis",
  name: "Luis Godoy",
  email: "luis.godoy@safetyclub.cl",
  orgId: "org_luis",
  orgName: "",
  isDemo: false,
};

export const ACTIVE_SESSION_STORAGE_KEY = "lifeon_active_session";

/**
 * Retorna la clave de almacenamiento adecuada para el aislamiento multi-organización.
 * Si es la organización demo (o no se especifica), utiliza la clave histórica para mantener
 * total compatibilidad y no perder datos existentes.
 */
export function getScopedStorageKey(baseKey: string, orgId?: string): string {
  if (!orgId || orgId === "org_demo") {
    return baseKey;
  }
  return `${baseKey}_${orgId}`;
}

/**
 * Valida credenciales contra las cuentas configuradas (Demo o Cuenta Limpia de Luis Godoy).
 */
export function authenticateUser(email: string, pass: string): { success: boolean; user?: AuthUser; message?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedPass = pass.trim();

  // 1. Cuenta Limpia de Luis Godoy
  if (normalizedEmail === "luis.godoy@safetyclub.cl") {
    if (trimmedPass === "luis") {
      setActiveUser(LUIS_USER);
      return { success: true, user: LUIS_USER };
    }
    return { success: false, message: "Contraseña incorrecta para luis.godoy@safetyclub.cl." };
  }

  // 2. Cuenta Demo tradicional (Sergio Jara)
  if (trimmedPass === "serg" || (normalizedEmail === "sergio.jara@lifeon.cl" && trimmedPass === "serg")) {
    setActiveUser(DEMO_USER);
    return { success: true, user: DEMO_USER };
  }

  return {
    success: false,
    message: "Credenciales inválidas. (Demo: serg | Usuario prueba: luis.godoy@safetyclub.cl / luis)",
  };
}

/**
 * Obtiene el usuario con sesión activa en el navegador.
 */
export function getActiveUser(): AuthUser {
  if (typeof window === "undefined") {
    return DEMO_USER;
  }
  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) {
        return parsed as AuthUser;
      }
    }
  } catch (e) {
    console.warn("Error leyendo sesión activa:", e);
  }
  return DEMO_USER;
}

/**
 * Establece el usuario con sesión activa en el navegador.
 */
export function setActiveUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn("Error guardando sesión activa:", e);
  }
}

/**
 * Cierra la sesión activa.
 */
export function logoutActiveUser(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
  } catch (e) {
    console.warn("Error limpiando sesión activa:", e);
  }
}

/**
 * Restablece la cuenta de prueba exclusivamente para luis.godoy@safetyclub.cl.
 * Elimina toda la información asociada a org_luis de localStorage y limpia la sesión.
 * Si el usuario no es luis.godoy@safetyclub.cl, la operación es rechazada por seguridad.
 */
export function resetLuisGodoyAccount(userEmail: string): boolean {
  if (typeof window === "undefined") return false;
  const normalized = (userEmail || "").trim().toLowerCase();
  if (normalized !== "luis.godoy@safetyclub.cl") {
    console.error("Seguridad: Intento no autorizado de restablecimiento de cuenta para:", userEmail);
    return false;
  }

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (key.includes("org_luis") || key.includes("luis.godoy"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    // Limpiar sesión activa
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    return true;
  } catch (e) {
    console.error("Error al restablecer cuenta de prueba:", e);
    return false;
  }
}

