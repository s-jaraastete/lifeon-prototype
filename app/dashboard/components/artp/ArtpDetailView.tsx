"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LuArrowLeft, LuPrinter, LuTrash2 } from "react-icons/lu";
import LoadingState from "@/components/reusable/LoadingState";
import { useArtpVersionDetail } from "@/hooks/useArtp";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import {
  publishArtpVersion,
  submitArtpForSignatures,
  syncArtpSignatureDeliveries,
  fetchArtpSignatureProgress,
} from "@/lib/repositories/artpRepository";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ArtpFormalDocument from "./ArtpFormalDocument";
import { ArtpSignedPdfPanel } from "./ArtpSignedPdfPanel";

interface ArtpDetailViewProps {
  versionId: string;
  onBack: () => void;
  onExecute?: () => void;
  onEdit?: () => void;
  onRefreshList?: () => void;
  onDeleteDraft?: (documentId: string, label: string) => void;
}

export function ArtpDetailView({
  versionId,
  onBack,
  onEdit,
  onRefreshList,
  onDeleteDraft,
}: ArtpDetailViewProps) {
  const { data: detail, isLoading, refetch } = useArtpVersionDetail(versionId);
  const { preferences } = useLifeOnPreferences();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (detail?.version.status !== "en_revision") return;
    void syncArtpSignatureDeliveries(versionId).then((ok) => {
      if (!ok) {
        setActionError(
          "No se pudieron registrar las solicitudes de firma en la app. Ejecuta node scripts/apply-artp-migration.mjs y vuelve a abrir esta ficha."
        );
      }
    });
  }, [detail?.version.status, versionId]);

  const signatures = useQuery({
    queryKey: ["artp", "signatures", versionId],
    queryFn: () => fetchArtpSignatureProgress(versionId),
    enabled:
      detail?.version.status === "en_revision" || detail?.version.status === "vigente",
    refetchInterval: detail?.version.status === "en_revision" ? 8000 : false,
  });

  useEffect(() => {
    if (!signatures.data?.allSigned || detail?.version.status !== "en_revision") return;
    void refetch();
  }, [signatures.data?.allSigned, detail?.version.status, refetch]);

  const signatureImages = useQuery({
    queryKey: ["artp", "signature-images", versionId],
    enabled: detail?.version.status === "en_revision",
    queryFn: async () => {
      const client = getSupabaseClient();
      const token = client
        ? (await client.auth.getSession()).data.session?.access_token
        : null;
      if (!token) return null;
      const res = await fetch(`/api/artp-versions/${versionId}/signature-images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return (await res.json()) as {
        supervisorDataUrl: string | null;
        workers: { id: string; dataUrl: string | null }[];
      };
    },
  });

  const documentDetail = useMemo(() => {
    if (!detail?.planning || !signatureImages.data) return detail;
    const images = signatureImages.data;
    return {
      ...detail,
      planning: {
        ...detail.planning,
        workContext: {
          ...detail.planning.workContext,
          supervisorSignatureDataUrl:
            images.supervisorDataUrl ?? detail.planning.workContext.supervisorSignatureDataUrl,
        },
        workers: detail.planning.workers.map((worker) => ({
          ...worker,
          signatureDataUrl:
            images.workers.find((item) => item.id === worker.id)?.dataUrl ??
            worker.signatureDataUrl,
        })),
      },
    };
  }, [detail, signatureImages.data]);

  if (isLoading || !detail || !documentDetail) {
    return <LoadingState />;
  }

  const organizationName = preferences.organizationName?.trim() || "Empresa";
  const status = detail.version.status;

  const runSubmitSignatures = async () => {
    setActionBusy(true);
    setActionError(null);
    const ok = await submitArtpForSignatures(versionId);
    setActionBusy(false);
    if (!ok) {
      setActionError(
        "No se pudo enviar a solicitud de firmas. Verifique permisos o aplique la migración 20261007 en Supabase."
      );
      return;
    }
    void refetch();
    onRefreshList?.();
  };

  const runPublishVigente = async () => {
    setActionBusy(true);
    setActionError(null);
    const ok = await publishArtpVersion(versionId);
    setActionBusy(false);
    if (!ok) {
      setActionError(
        "No se pudo publicar como vigente. Aplique la migración 20261007 (pgcrypto + RPC) en Supabase si el error persiste."
      );
      return;
    }
    void refetch();
    onRefreshList?.();
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <LuArrowLeft /> Volver al listado
        </button>
        <div className="flex flex-wrap gap-2">
          {status !== "vigente" && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <LuPrinter /> Imprimir / PDF
            </button>
          )}
          {onEdit && (status === "borrador" || status === "en_revision") && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold"
            >
              Editar planificación
            </button>
          )}
          {onDeleteDraft && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() =>
                onDeleteDraft(detail.document.id, detail.document.name || detail.version.taskName)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
            >
              <LuTrash2 /> Eliminar
            </button>
          )}
          {status === "borrador" && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void runSubmitSignatures()}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Enviar solicitud de firmas
            </button>
          )}
          {status === "en_revision" && signatures.data?.allSigned && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void runPublishVigente()}
              className="rounded-xl bg-[#F04438] px-4 py-2 text-xs font-semibold text-white hover:bg-[#D92D20] disabled:opacity-50"
            >
              Publicar vigente
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {actionError}
        </p>
      )}

      {(status === "en_revision" || status === "vigente") && (
        <ArtpSignatureTracker
          pending={signatures.data?.pending ?? 0}
          total={signatures.data?.total ?? 0}
          signers={signatures.data?.signers ?? []}
          loading={signatures.isLoading}
        />
      )}

      {status === "vigente" ? (
        <div className="flex justify-center">
          <ArtpSignedPdfPanel versionId={versionId} />
        </div>
      ) : (
        <div className="print:p-0 flex justify-center">
          <ArtpFormalDocument
            organizationName={organizationName}
            organizationLogoUrl={preferences.organizationLogo ?? null}
            detail={documentDetail}
            issuedAt={
              documentDetail.planning?.workContext?.workDate ??
              documentDetail.version.publishedAt ??
              undefined
            }
          />
        </div>
      )}
    </div>
  );
}

function roleLabel(role: string): string {
  if (role === "supervisor") return "Supervisor";
  if (role === "worker_and_supervisor") return "Trabajador y supervisor";
  return "Trabajador";
}

function ArtpSignatureTracker(props: {
  signers: {
    memberId: string;
    name: string;
    role: string;
    status: string;
    signedAt?: string | null;
  }[];
  pending: number;
  total: number;
  loading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-bold text-gray-900">Seguimiento de firmas</h2>
        <span className="text-xs font-semibold text-gray-600">
          {props.loading
            ? "Actualizando…"
            : props.total === 0
              ? "Sin solicitudes"
              : `${props.total - props.pending} de ${props.total} firmadas`}
        </span>
      </div>
      {props.signers.length === 0 && !props.loading ? (
        <p className="text-xs text-gray-500">
          Aún no hay entregas de firma. Abre esta ficha de nuevo si acabas de enviar el documento.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {props.signers.map((signer) => {
            const signed = signer.status === "firmado";
            return (
              <li
                key={signer.memberId}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold text-gray-900">{signer.name}</p>
                  <p className="text-xs text-gray-500">{roleLabel(signer.role)}</p>
                </div>
                <span
                  className={
                    signed
                      ? "rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800"
                      : "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
                  }
                >
                  {signed
                    ? `Firmó${signer.signedAt ? ` · ${new Date(signer.signedAt).toLocaleString("es-CL")}` : ""}`
                    : "Pendiente"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
