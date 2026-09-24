"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Props = {
  deliveryId?: string | null;
  preview?: {
    organizationId: string;
    snapshot: Record<string, unknown>;
    documentCode?: string | null;
    signedAt?: string | null;
  };
  minHeight?: number;
  className?: string;
};

export function IrlDeliveryPdfEmbed({
  deliveryId,
  preview,
  minHeight = 640,
  className = "",
}: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const previewKey =
    preview?.snapshot != null ? JSON.stringify(preview.snapshot) : "";

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setPdfUrl(null);

      const client = getSupabaseClient();
      if (!client) {
        setError("Supabase no configurado");
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session?.access_token) {
        setError("Inicia sesión para ver el documento");
        setLoading(false);
        return;
      }

      try {
        let res: Response;
        if (deliveryId) {
          res = await fetch(`/api/document-deliveries/${deliveryId}/pdf`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        } else if (preview) {
          res = await fetch("/api/document-deliveries/irl-pdf-preview", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              organizationId: preview.organizationId,
              snapshot: preview.snapshot,
              documentCode: preview.documentCode ?? null,
              signedAt: preview.signedAt ?? null,
            }),
          });
        } else {
          setError("No hay documento para mostrar");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(json.error ?? "No se pudo generar el PDF");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        revoked = url;
        if (!cancelled) setPdfUrl(url);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar PDF");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [deliveryId, preview?.organizationId, preview?.documentCode, preview?.signedAt, previewKey]);

  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl bg-gray-200/80 text-sm text-gray-600 ${className}`}
        style={{ minHeight }}
      >
        Generando PDF…
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-red-50 text-sm text-red-700 p-4 ${className}`}
        style={{ minHeight: 120 }}
      >
        {error ?? "PDF no disponible"}
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="self-end text-xs font-semibold text-teal-700 hover:underline"
      >
        Abrir PDF en pestaña nueva
      </a>
      <iframe
        src={`${pdfUrl}#toolbar=1&navpanes=0`}
        title="Documento IRL PDF"
        className="w-full rounded-lg border-0 bg-[#525659]"
        style={{ minHeight, height: minHeight }}
      />
    </div>
  );
}
