"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export function ArtpSignedPdfPanel({ versionId }: { versionId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    async function load() {
      setError(null);
      const client = getSupabaseClient();
      const session = client ? (await client.auth.getSession()).data.session : null;
      if (!session?.access_token) {
        setError("Inicia sesión para ver el PDF firmado.");
        return;
      }
      const res = await fetch(`/api/artp-versions/${versionId}/pdf`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!cancelled) setError(json.error ?? "No se pudo generar el PDF firmado.");
        return;
      }
      const blob = await res.blob();
      const next = URL.createObjectURL(blob);
      revoked = next;
      if (!cancelled) setUrl(next);
    }

    void load();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [versionId]);

  if (error) {
    return (
      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 w-full max-w-3xl">
        {error}
      </p>
    );
  }
  if (!url) {
    return <p className="text-sm text-gray-500">Generando PDF firmado…</p>;
  }

  return (
    <iframe
      title="ARTP vigente firmado"
      src={url}
      className="w-full max-w-[216mm] min-h-[1100px] rounded-md border border-gray-300 bg-white"
    />
  );
}
