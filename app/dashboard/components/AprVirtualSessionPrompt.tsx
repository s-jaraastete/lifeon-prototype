"use client";

import { useState } from "react";
import clsx from "clsx";
import { LuAtom, LuLock } from "react-icons/lu";
import useLifeOnPreferences from "@/hooks/useLifeOnPreferences";
import {
  hasLifeOnAiSession,
  syncLifeOnSessionCookie,
} from "@/lib/auth/lifeonSessionClient";

type AprVirtualSessionPromptProps = {
  onReady?: () => void;
  className?: string;
};

export default function AprVirtualSessionPrompt({
  onReady,
  className,
}: AprVirtualSessionPromptProps) {
  const { currentUser } = useLifeOnPreferences();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = currentUser?.email?.trim() || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password.trim()) return;
    setLoading(true);
    setError(null);

    const result = await syncLifeOnSessionCookie(email, password);
    if (!result.ok) {
      setError(
        result.message ||
          "No se pudo activar APR Virtual IA. Si desplegaste en Vercel, verifica GROQ_API_KEY y LIFEON_SESSION_SECRET y redeploy."
      );
      setLoading(false);
      return;
    }

    const verified = await hasLifeOnAiSession();
    if (!verified) {
      setError(
        "El servidor no guardó la sesión. Revisa LIFEON_SESSION_SECRET en Vercel (Production y Preview), redeploy e intenta de nuevo."
      );
      setLoading(false);
      return;
    }

    setPassword("");
    onReady?.();
    setLoading(false);
  };

  return (
    <section
      className={clsx(
        "rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-teal-50/40 p-4 shadow-xs",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
          <LuAtom className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900">Activa APR Virtual IA en este navegador</h2>
          <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
            El dashboard usa una sesión local, pero la IA necesita una cookie segura del servidor.
            Introduce tu contraseña de acceso una vez (no se guarda en el navegador).
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            En Vercel personal: variables <code className="font-mono">GROQ_API_KEY</code> y{" "}
            <code className="font-mono">LIFEON_SESSION_SECRET</code> en Production y Preview, luego
            redeploy.
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              readOnly
              className="flex-1 min-w-0 px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white/80 text-gray-700"
            />
            <div className="relative flex-1 min-w-0">
              <LuLock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña de tu cuenta"
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap"
            >
              {loading ? "Activando…" : "Activar IA"}
            </button>
          </form>

          {error && (
            <p className="text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mt-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
