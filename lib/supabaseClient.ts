import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Determina si las variables de entorno de Supabase están correctamente definidas.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("tu-proyecto") &&
    !supabaseAnonKey.includes("tu-anon-public-key")
  );
};

/** Diagnóstico sin exponer secretos (útil en producción). */
export function getSupabasePublicConfigStatus(): {
  configured: boolean;
  urlHost: string;
  hasAnonKey: boolean;
} {
  let urlHost = "";
  try {
    if (supabaseUrl) urlHost = new URL(supabaseUrl).host;
  } catch {
    urlHost = "";
  }
  return {
    configured: isSupabaseConfigured(),
    urlHost,
    hasAnonKey: Boolean(supabaseAnonKey),
  };
}

let clientInstance: SupabaseClient | null = null;

/**
 * Retorna la instancia de Supabase Client si está configurada, o null si está en modo local.
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return clientInstance;
};

export const supabase = getSupabaseClient();
