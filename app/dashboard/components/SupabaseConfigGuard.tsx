"use client";

import { isSupabaseConfigured, getSupabasePublicConfigStatus } from "@/lib/supabaseClient";
import { mustUseSupabasePersistence } from "@/lib/env/runtime";

/**
 * Blocks dashboard usage when Supabase is required but not configured (e.g. Vercel Production).
 */
export default function SupabaseConfigGuard({ children }: { children: React.ReactNode }) {
  const required = mustUseSupabasePersistence();
  const configured = isSupabaseConfigured();

  if (!required || configured) {
    return <>{children}</>;
  }

  const status = getSupabasePublicConfigStatus();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg w-full rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-bold text-gray-900">Configuración de Supabase requerida</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Este entorno no puede operar en modo solo navegador. Configura{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          en Vercel (Production y Preview) y vuelve a desplegar.
        </p>
        <ul className="mt-4 text-xs text-gray-500 space-y-1">
          <li>URL configurada: {status.urlHost || "—"}</li>
          <li>Anon key presente: {status.hasAnonKey ? "sí" : "no"}</li>
        </ul>
      </div>
    </div>
  );
}
