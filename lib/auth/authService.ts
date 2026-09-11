import { resetSupabaseDataForOrg } from "@/lib/services/supabaseService";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName: string;
  isDemo: boolean;
  avatarUrl?: string | null;
}

export interface TestAccountConfig {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName: string;
  isDemo: boolean;
  resetAllowed: boolean;
  avatarUrl?: string | null;
}

/**
 * Catálogo centralizado de cuentas de prueba / desarrollo.
 * Cada cuenta de prueba pertenece a una organización (orgId) completamente independiente.
 */
export const TEST_ACCOUNTS_CONFIG: Record<string, TestAccountConfig> = {
  "luis.godoy@safetyclub.cl": {
    id: "user_luis",
    name: "Luis Godoy",
    email: "luis.godoy@safetyclub.cl",
    orgId: "org_luis",
    orgName: "SafetyCo Consultores SpA",
    isDemo: false,
    resetAllowed: true,
  },
  "sergio.jara@safetyclub.cl": {
    id: "user_sergio",
    name: "Sergio Jara",
    email: "sergio.jara@safetyclub.cl",
    orgId: "org_sergio",
    orgName: "Constructora Horizonte SpA",
    isDemo: false,
    resetAllowed: true,
  },
  "aldo.berrios@safetyclub.cl": {
    id: "user_aldo",
    name: "Aldo Berríos",
    email: "aldo.berrios@safetyclub.cl",
    orgId: "org_aldo",
    orgName: "Berríos Ingeniería y Construcción SpA",
    isDemo: false,
    resetAllowed: true,
  },
  "gonzalo.cabrera@safetyclub.cl": {
    id: "user_gonzalo_c",
    name: "Gonzalo Cabrera",
    email: "gonzalo.cabrera@safetyclub.cl",
    orgId: "org_gonzalo_c",
    orgName: "Cabrera Seguridad Industrial SpA",
    isDemo: false,
    resetAllowed: true,
  },
  "gonzalo.beristain@safetyclub.cl": {
    id: "user_gonzalo_b",
    name: "Gonzalo Beristain",
    email: "gonzalo.beristain@safetyclub.cl",
    orgId: "org_gonzalo_b",
    orgName: "Beristain Prevención SpA",
    isDemo: false,
    resetAllowed: true,
  },
  "sergio.jara@lifeon.cl": {
    id: "demo_sergio",
    name: "Sergio A. Jara Astete",
    email: "sergio.jara@lifeon.cl",
    orgId: "org_demo",
    orgName: "Constructora y Servicios Santiago SpA",
    isDemo: true,
    resetAllowed: false,
  },
};

// Contraseñas de desarrollo para autenticación local
const DEV_PASSWORDS: Record<string, string[]> = {
  "luis.godoy@safetyclub.cl": ["luis"],
  "sergio.jara@safetyclub.cl": ["serg", "sergio"],
  "aldo.berrios@safetyclub.cl": ["aldo"],
  "gonzalo.cabrera@safetyclub.cl": ["gonz"],
  "gonzalo.beristain@safetyclub.cl": ["gonz"],
  "sergio.jara@lifeon.cl": ["serg"],
};

export const DEMO_USER: AuthUser = TEST_ACCOUNTS_CONFIG["sergio.jara@lifeon.cl"];
export const LUIS_USER: AuthUser = TEST_ACCOUNTS_CONFIG["luis.godoy@safetyclub.cl"];
export const SERGIO_USER: AuthUser = TEST_ACCOUNTS_CONFIG["sergio.jara@safetyclub.cl"];

export const ACTIVE_SESSION_STORAGE_KEY = "lifeon_active_session";
export const SESSION_CHANGE_EVENT = "lifeon-session-change";

/**
 * Lista centralizada y estricta de emails autorizados para restablecer su cuenta de prueba.
 * Derivada automáticamente de TEST_ACCOUNTS_CONFIG donde resetAllowed es true.
 */
export const TEST_RESET_ALLOWED_EMAILS: string[] = Object.values(TEST_ACCOUNTS_CONFIG)
  .filter((acc) => acc.resetAllowed)
  .map((acc) => acc.email.toLowerCase());

/**
 * Verifica si un usuario tiene autorización para ver y ejecutar el restablecimiento de cuenta.
 */
export function isResetAllowedForUser(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return TEST_RESET_ALLOWED_EMAILS.includes(normalized);
}

/**
 * Retorna la clave de almacenamiento adecuada para el aislamiento multi-organización.
 * Si es la organización demo (o no se especifica), utiliza la clave histórica para mantener
 * total compatibilidad.
 */
export function getScopedStorageKey(baseKey: string, orgId?: string): string {
  if (!orgId || orgId === "org_demo") {
    return baseKey;
  }
  return `${baseKey}_${orgId}`;
}

/**
 * Valida credenciales contra las cuentas configuradas en entorno local.
 */
export function authenticateUser(email: string, pass: string): { success: boolean; user?: AuthUser; message?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedPass = pass.trim();

  // Búsqueda por email
  const account = TEST_ACCOUNTS_CONFIG[normalizedEmail];
  if (account) {
    const validPasses = DEV_PASSWORDS[normalizedEmail] || [];
    if (validPasses.includes(trimmedPass)) {
      const user: AuthUser = {
        id: account.id,
        name: account.name,
        email: account.email,
        orgId: account.orgId,
        orgName: account.orgName,
        isDemo: account.isDemo,
        avatarUrl: account.avatarUrl || null,
      };
      setActiveUser(user);
      return { success: true, user };
    }
    return { success: false, message: `Contraseña incorrecta para ${normalizedEmail}.` };
  }

  // Fallback rápido por contraseña si no se especificó un email completo
  if (trimmedPass === "serg" || trimmedPass === "sergio") {
    setActiveUser(SERGIO_USER);
    return { success: true, user: SERGIO_USER };
  }
  if (trimmedPass === "luis") {
    setActiveUser(LUIS_USER);
    return { success: true, user: LUIS_USER };
  }
  if (trimmedPass === "aldo") {
    const user = TEST_ACCOUNTS_CONFIG["aldo.berrios@safetyclub.cl"];
    setActiveUser(user);
    return { success: true, user };
  }
  if (trimmedPass === "gonz") {
    const user = TEST_ACCOUNTS_CONFIG["gonzalo.cabrera@safetyclub.cl"];
    setActiveUser(user);
    return { success: true, user };
  }

  return {
    success: false,
    message: "Credenciales inválidas. Cuentas de prueba autorizadas: luis.godoy@safetyclub.cl (luis), sergio.jara@safetyclub.cl (serg), aldo.berrios@safetyclub.cl (aldo), gonzalo.cabrera@safetyclub.cl (gonz), gonzalo.beristain@safetyclub.cl (gonz).",
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
 * Establece el usuario con sesión activa en el navegador y notifica a los suscriptores.
 */
export function setActiveUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT, { detail: user }));
  } catch (e) {
    console.warn("Error guardando sesión activa:", e);
  }
}

/**
 * Cierra la sesión activa y notifica a los suscriptores.
 */
export function logoutActiveUser(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT, { detail: null }));
  } catch (e) {
    console.warn("Error limpiando sesión activa:", e);
  }
}

/**
 * Restablece la cuenta de prueba autorizada (exclusivamente luis.godoy@safetyclub.cl o sergio.jara@safetyclub.cl).
 * Elimina completamente de Supabase y localStorage toda la estructura, matrices, programa,
 * preferencias y archivos de la organización asociada, dejándola como una cuenta completamente nueva y vacía.
 */
export async function resetTestAccount(userEmail: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const normalized = (userEmail || "").trim().toLowerCase();

  // Validación estricta en la capa de servicio
  if (!isResetAllowedForUser(normalized)) {
    console.error("Seguridad: Intento no autorizado de restablecimiento de cuenta para:", userEmail);
    return false;
  }

  const account = TEST_ACCOUNTS_CONFIG[normalized];
  const orgId = account?.orgId || (normalized.includes("luis") ? "org_luis" : "org_sergio");
  const userId = account?.id || (normalized.includes("luis") ? "user_luis" : "user_sergio");

  try {
    // 1. Limpiar base de datos Supabase respetando orden de dependencias
    await resetSupabaseDataForOrg(orgId, userId);

    // 2. Limpiar todas las claves de localStorage vinculadas al usuario o su organización
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (
        key &&
        (key.includes(orgId) ||
          key.includes(userId) ||
          key.includes(normalized) ||
          key.includes(`lifeon_iper_draft_${orgId}`) ||
          key.includes(`lifeon_active_workplace_${orgId}`) ||
          key.includes(`lifeon_org_structure_${orgId}`) ||
          key.includes(`lifeon_iper_matrices_${orgId}`) ||
          key.includes(`lifeon_preventive_program_${orgId}`) ||
          key.includes(`lifeon_preferences_${orgId}`) ||
          key === "lifeon_active_session")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));

    // 3. Limpiar sessionStorage
    try {
      window.sessionStorage.clear();
    } catch (_) {}

    // 4. Notificar a todos los módulos y cerrar sesión activa
    window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT, { detail: null }));
    window.dispatchEvent(new CustomEvent("lifeon-org-structure-change", { detail: null }));
    window.dispatchEvent(new CustomEvent("lifeon-iper-matrices-change", { detail: null }));
    window.dispatchEvent(new CustomEvent("lifeon-preventive-program-change", { detail: null }));

    return true;
  } catch (e) {
    console.error("Error al restablecer cuenta de prueba:", e);
    return false;
  }
}

/**
 * Retrocompatibilidad con llamadas existentes a resetLuisGodoyAccount.
 */
export function resetLuisGodoyAccount(userEmail: string): boolean {
  resetTestAccount(userEmail);
  return true;
}
