"use client";

import { FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      setMessage("Supabase no está configurado.");
      return;
    }
    setLoading(true);
    const { error } = await client.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Contraseña actualizada. Ya puedes iniciar sesión en LifeOn Web o Mobile.");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Establecer contraseña</h1>
        <p className="text-sm text-gray-600 mb-6">
          Define tu contraseña para acceder a LifeOn con el mismo usuario en web y móvil.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <input
            type="password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {message ? <p className="text-sm text-gray-700">{message}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}
