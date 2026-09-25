"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, getSupabasePublicConfigStatus, getSupabaseClient } from "@/lib/supabaseClient";
import { mustUseSupabasePersistence, requiresSupabaseAuthSession } from "@/lib/env/runtime";
import { refreshActiveUserFromSupabaseSession } from "@/lib/auth/lifeonAuth";
import { logoutActiveUser } from "@/lib/auth/authService";

/**
 * Blocks dashboard usage when Supabase is required but not configured (e.g. Vercel Production).
 * When Supabase is configured, requires a live Auth session so RLS-backed reads succeed.
 */
export default function SupabaseConfigGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const required = mustUseSupabasePersistence();
  const configured = isSupabaseConfigured();
  const needsAuthSession = requiresSupabaseAuthSession();
  const [sessionReady, setSessionReady] = useState(!needsAuthSession);

  useEffect(() => {
    if (!configured) return;
    const client = getSupabaseClient();
    if (!client) return;

    let cancelled = false;

    const syncFromSession = async () => {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (cancelled) return;

      if (!session?.user?.email) {
        if (needsAuthSession) {
          logoutActiveUser();
          router.replace("/login?reason=supabase_session");
        }
        setSessionReady(true);
        return;
      }

      await refreshActiveUserFromSupabaseSession();
      if (!cancelled) setSessionReady(true);
    };

    void syncFromSession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        void refreshActiveUserFromSupabaseSession();
        setSessionReady(true);
      } else if (needsAuthSession) {
        logoutActiveUser();
        router.replace("/login?reason=supabase_session");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured, needsAuthSession, router]);

  if (!required || configured) {
    if (needsAuthSession && configured && !sessionReady) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-600">Conectando con Supabase…</p>
        </div>
      );
    }
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
