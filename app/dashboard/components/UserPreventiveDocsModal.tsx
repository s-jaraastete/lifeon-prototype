"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  LuX,
  LuFileText,
  LuShieldCheck,
  LuClipboardList,
  LuPrinter,
  LuCircleCheck,
  LuClock,
} from "react-icons/lu";
import type { PlatformUser } from "@/types/users";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { useIperMatrices } from "@/hooks/useIperMatrices";
import type { IrlAcknowledgement } from "@/types/irlAcknowledgements";
import {
  findIrlAckForUser,
  getUserPreventiveAck,
  upsertUserPreventiveAck,
} from "@/lib/utils/userPreventiveDocs";
import {
  fetchDeliveriesForAssigneeMember,
  type DocumentDeliveryDetail,
} from "@/lib/repositories/documentDeliveriesRepository";
import { getActiveUser } from "@/lib/auth/authService";
import { IrlDeliveryPdfEmbed } from "./IrlDeliveryPdfEmbed";
import { buildIrlDocumentCode, parseIrlSnapshot } from "@/lib/irl/irlDocumentCopy";
import { buildIrlPreviewSnapshot } from "@/lib/irl/buildIrlPreviewSnapshot";
import {
  indexIrlDeliveriesByMatrix,
  irlMatrixStorageKey,
  matrixIdsMatch,
} from "@/lib/utils/irlDeliveryGrouping";
import type { IperMatrixItem } from "./IperMatrixView";

type UserPreventiveDocsModalProps = {
  user: PlatformUser;
  onClose: () => void;
};

type DocView =
  | null
  | {
      type: "irl";
      storageKey: string;
      matrixId: string;
      displayTitle: string;
      ack?: IrlAcknowledgement;
      delivery?: DocumentDeliveryDetail;
      matrix?: IperMatrixItem;
    }
  | { type: "reglamento" }
  | { type: "epp" };

type IrlListEntry = {
  storageKey: string;
  matrixId: string;
  displayTitle: string;
  status: "Firmado" | "Pendiente";
  ack?: IrlAcknowledgement;
  delivery?: DocumentDeliveryDetail;
  matrix?: IperMatrixItem;
};

function entryStatus(
  delivery: DocumentDeliveryDetail | undefined,
  ack: IrlAcknowledgement | undefined
): "Firmado" | "Pendiente" {
  if (delivery?.status === "firmado" || ack?.status === "Firmado") return "Firmado";
  return "Pendiente";
}

export default function UserPreventiveDocsModal({ user, onClose }: UserPreventiveDocsModalProps) {
  const { preferences, updatePreferences } = useLifeOnPreferences();
  const { vigentesMatrices } = useIperMatrices();
  const [docView, setDocView] = useState<DocView>(null);
  const [memberDeliveries, setMemberDeliveries] = useState<DocumentDeliveryDetail[]>([]);

  const orgId = user.organizationId || getActiveUser().orgId;
  const organizationName = preferences.organizationName?.trim() || "Empresa";
  const organizationLogoUrl = preferences.organizationLogo ?? null;
  const cargoLabel = user.cargoName?.trim() || "Cargo";

  useEffect(() => {
    if (!orgId || !user.id) {
      setMemberDeliveries([]);
      return;
    }
    let cancelled = false;
    fetchDeliveriesForAssigneeMember(orgId, user.id).then((rows) => {
      if (!cancelled) setMemberDeliveries(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId, user.id]);

  const deliveryByMatrixKey = useMemo(
    () => indexIrlDeliveriesByMatrix(memberDeliveries, orgId),
    [memberDeliveries, orgId]
  );

  const acks = preferences.userPreventiveDocAcknowledgements || [];
  const regAck = getUserPreventiveAck(acks, user.id, "reglamento_interno");
  const eppAck = getUserPreventiveAck(acks, user.id, "epp_entrega");

  const irlEntries = useMemo(() => {
    const cargo = user.cargoName?.trim().toLowerCase();
    const map = new Map<string, IrlListEntry>();

    const upsert = (key: string, patch: Partial<IrlListEntry> & { storageKey: string }) => {
      const prev = map.get(key);
      map.set(key, {
        storageKey: key,
        matrixId: patch.matrixId ?? prev?.matrixId ?? key,
        displayTitle: patch.displayTitle ?? prev?.displayTitle ?? `IRL — ${cargoLabel}`,
        status: patch.status ?? prev?.status ?? "Pendiente",
        ack: patch.ack ?? prev?.ack,
        delivery: patch.delivery ?? prev?.delivery,
        matrix: patch.matrix ?? prev?.matrix,
      });
    };

    for (const m of vigentesMatrices) {
      const key = irlMatrixStorageKey(m.id, orgId);
      const evals =
        m.evaluations || (m as { hazards?: { cargo?: string }[] }).hazards || [];
      const hasCargoInMatrix =
        cargo &&
        Array.isArray(evals) &&
        evals.some((ev) =>
          (ev.cargo || "")
            .split(/[,/;•]/)
            .map((c) => c.trim().toLowerCase())
            .includes(cargo)
        );
      const ack = findIrlAckForUser((m.acknowledgements || []) as IrlAcknowledgement[], user, m.id);
      const delivery = deliveryByMatrixKey.get(key);
      if (!hasCargoInMatrix && !ack && !delivery) continue;

      const mergedDelivery = delivery;
      upsert(key, {
        storageKey: key,
        matrixId: m.id,
        displayTitle: `IRL — ${cargoLabel}`,
        matrix: m,
        ack,
        delivery: mergedDelivery,
        status: entryStatus(mergedDelivery, ack),
      });
    }

    for (const [key, delivery] of deliveryByMatrixKey) {
      if (map.has(key)) {
        const prev = map.get(key)!;
        upsert(key, {
          storageKey: key,
          delivery,
          status: entryStatus(delivery, prev.ack),
        });
        continue;
      }
      const snap = delivery.content_snapshot ?? {};
      const snapCargo =
        typeof snap.cargoName === "string" && snap.cargoName.trim()
          ? snap.cargoName.trim()
          : cargoLabel;
      upsert(key, {
        storageKey: key,
        matrixId: delivery.source_id,
        displayTitle: `IRL — ${snapCargo}`,
        delivery,
        status: entryStatus(delivery, undefined),
      });
    }

    return Array.from(map.values());
  }, [vigentesMatrices, user, orgId, deliveryByMatrixKey, cargoLabel]);

  const markSigned = (kind: "reglamento_interno" | "epp_entrega") => {
    const next = upsertUserPreventiveAck(acks, user.id, kind, "Firmado");
    updatePreferences({ userPreventiveDocAcknowledgements: next });
  };

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

  const printView = () => {
    if (typeof window !== "undefined") window.print();
  };

  const viewingDocument = docView !== null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4">
      <div
        className={clsx(
          "bg-white w-full rounded-2xl shadow-2xl border border-gray-100 max-h-[94vh] overflow-hidden flex flex-col",
          viewingDocument ? "max-w-[min(100%,230mm)]" : "max-w-2xl"
        )}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 print:hidden">
          <div>
            <h2 className="text-base font-bold text-gray-900">Documentación preventiva personal</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {fullName} · {user.cargoName || "Sin cargo"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 cursor-pointer">
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {!docView ? (
          <div className="p-5 flex flex-col gap-3 overflow-y-auto">
            {irlEntries.length === 0 ? (
              <DocCard
                icon={LuShieldCheck}
                title="Información de Riesgos Laborales (IRL)"
                status="Pendiente"
                hint="Requiere matriz IPER vigente con el cargo del trabajador."
                disabled
              />
            ) : (
              irlEntries.map((entry) => (
                <DocCard
                  key={entry.storageKey}
                  icon={LuShieldCheck}
                  title={entry.displayTitle}
                  status={entry.status}
                  onOpen={() =>
                    setDocView({
                      type: "irl",
                      storageKey: entry.storageKey,
                      matrixId: entry.matrixId,
                      displayTitle: entry.displayTitle,
                      ack: entry.ack,
                      delivery: entry.delivery,
                      matrix: entry.matrix,
                    })
                  }
                />
              ))
            )}

            <DocCard
              icon={LuClipboardList}
              title="Registro de difusión y entrega — Reglamento Interno OHYS"
              status={regAck?.status === "Firmado" ? "Firmado" : "Pendiente"}
              onOpen={() => setDocView({ type: "reglamento" })}
            />

            <DocCard
              icon={LuFileText}
              title="Registro de entrega de Elementos de Protección Personal"
              status={eppAck?.status === "Firmado" ? "Firmado" : "Pendiente"}
              onOpen={() => setDocView({ type: "epp" })}
            />
          </div>
        ) : (
          <div className="p-3 sm:p-5 overflow-y-auto flex flex-col gap-4 print:p-0">
            <button
              type="button"
              onClick={() => setDocView(null)}
              className="text-xs font-semibold text-teal-700 hover:underline self-start cursor-pointer print:hidden"
            >
              ← Volver al listado
            </button>

            {docView.type === "irl" && (
              <IrlPersonalDocumentView
                docView={docView}
                user={user}
                organizationName={organizationName}
                organizationLogoUrl={organizationLogoUrl}
                vigentesMatrices={vigentesMatrices}
                orgId={orgId}
              />
            )}

            {docView.type === "reglamento" && (
              <>
                <h3 className="text-sm font-bold text-gray-900">
                  Registro de difusión y entrega — Reglamento Interno de Orden, Higiene y Seguridad
                </h3>
                <PrintBlock
                  title="Toma de conocimiento"
                  body={`Se deja constancia que a ${fullName} (${user.identificationNumber || "[COMPLETAR]"}), en calidad de ${user.cargoName || "[COMPLETAR]"}, se le entregó y difundió el Reglamento Interno de Orden, Higiene y Seguridad de la empresa, comprometiéndose a su cumplimiento.`}
                />
                <StatusRow status={regAck?.status === "Firmado" ? "Firmado" : "Pendiente"} />
                {regAck?.status !== "Firmado" && (
                  <button
                    type="button"
                    onClick={() => markSigned("reglamento_interno")}
                    className="self-start px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer print:hidden"
                  >
                    Registrar firma / entrega
                  </button>
                )}
              </>
            )}

            {docView.type === "epp" && (
              <>
                <h3 className="text-sm font-bold text-gray-900">
                  Registro de entrega de Elementos de Protección Personal
                </h3>
                <PrintBlock
                  title="Entrega gratuita de EPP"
                  body={`Constancia de entrega de EPP a ${fullName} (${user.identificationNumber || "[COMPLETAR]"}), cargo ${user.cargoName || "[COMPLETAR]"}, con descripción de elementos, talla/serie según corresponda, y compromiso de uso permanente conforme a procedimientos internos y DS 594.`}
                />
                <StatusRow status={eppAck?.status === "Firmado" ? "Firmado" : "Pendiente"} />
                {eppAck?.status !== "Firmado" && (
                  <button
                    type="button"
                    onClick={() => markSigned("epp_entrega")}
                    className="self-start px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer print:hidden"
                  >
                    Registrar firma / entrega
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={printView}
              className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer print:hidden"
            >
              <LuPrinter className="w-4 h-4" />
              Imprimir vista
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function IrlPersonalDocumentView({
  docView,
  user,
  organizationName,
  organizationLogoUrl,
  vigentesMatrices,
  orgId,
}: {
  docView: Extract<DocView, { type: "irl" }>;
  user: PlatformUser;
  organizationName: string;
  organizationLogoUrl?: string | null;
  vigentesMatrices: IperMatrixItem[];
  orgId: string;
}) {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  const cargoName = user.cargoName?.trim() || "—";

  const matrix =
    docView.matrix ??
    vigentesMatrices.find((m) => matrixIdsMatch(m.id, docView.matrixId, orgId));

  const delivery = docView.delivery;
  const signedDelivery = delivery?.status === "firmado" ? delivery : undefined;
  const pendingDelivery =
    delivery && delivery.status !== "firmado" ? delivery : undefined;
  const activeDelivery = signedDelivery ?? pendingDelivery;

  const snapFromDelivery = parseIrlSnapshot(activeDelivery?.content_snapshot ?? {});

  const matrixCode = snapFromDelivery.matrixCode || matrix?.code || "—";

  const previewSnapshot = useMemo(() => {
    if (activeDelivery?.id) return null;
    if (!matrix) return null;
    return buildIrlPreviewSnapshot({
      matrix: {
        id: matrix.id,
        code: matrix.code,
        title: matrix.title,
        name: matrix.name,
        responsible: matrix.responsible,
        workCenterName: matrix.workCenterName,
        workCenter: matrix.workCenter,
        evaluations: matrix.evaluations,
        hazards: (matrix as { hazards?: unknown[] }).hazards,
      },
      cargoName,
      organizationName: snapFromDelivery.organizationName || organizationName,
      organizationLogoUrl: snapFromDelivery.organizationLogoUrl ?? organizationLogoUrl,
      assigneeFullName: fullName,
      assigneeIdentificationNumber: user.identificationNumber ?? null,
    });
  }, [
    activeDelivery?.id,
    matrix,
    cargoName,
    organizationName,
    organizationLogoUrl,
    fullName,
    user.identificationNumber,
    snapFromDelivery.organizationName,
    snapFromDelivery.organizationLogoUrl,
  ]);

  const preview = useMemo(() => {
    if (!previewSnapshot) return undefined;
    return {
      organizationId: orgId,
      snapshot: previewSnapshot,
      documentCode:
        (typeof previewSnapshot.documentCode === "string"
          ? previewSnapshot.documentCode
          : null) ?? buildIrlDocumentCode(matrixCode, cargoName),
      signedAt: null as string | null,
    };
  }, [previewSnapshot, orgId, matrixCode, cargoName]);

  const status = entryStatus(signedDelivery ?? pendingDelivery, docView.ack);

  return (
    <div className="flex flex-col gap-3">
      <div className="print:hidden flex flex-wrap items-center gap-2 justify-between">
        <h3 className="text-sm font-bold text-gray-900">{docView.displayTitle}</h3>
        <StatusRow status={status} />
      </div>
      {signedDelivery?.signed_at ? (
        <p className="text-[11px] text-gray-600 print:hidden">
          Firmado el{" "}
          <strong>{new Date(signedDelivery.signed_at).toLocaleString("es-CL")}</strong>
          {signedDelivery.document_code ? ` · Código ${signedDelivery.document_code}` : null}
        </p>
      ) : null}

      <IrlDeliveryPdfEmbed
        deliveryId={activeDelivery?.id}
        preview={preview}
        minHeight={720}
      />

      <p className="text-[10px] text-gray-500 text-center leading-snug print:mt-2">
        Documento IRL del cargo · Referencia técnica: Matriz IPER {matrixCode}
      </p>
    </div>
  );
}

function DocCard({
  icon: Icon,
  title,
  status,
  hint,
  disabled,
  onOpen,
}: {
  icon: React.ElementType;
  title: string;
  status: "Firmado" | "Pendiente";
  hint?: string;
  disabled?: boolean;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className={clsx(
        "w-full text-left p-4 rounded-2xl border flex items-start gap-3 transition",
        disabled
          ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
          : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/40 cursor-pointer"
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-gray-900 leading-snug">{title}</p>
        {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
        <span
          className={clsx(
            "inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border",
            status === "Firmado"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          )}
        >
          {status === "Firmado" ? <LuCircleCheck className="w-3 h-3" /> : <LuClock className="w-3 h-3" />}
          {status}
        </span>
      </div>
    </button>
  );
}

function PrintBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/80">
      <p className="text-xs font-bold text-gray-800 mb-2">{title}</p>
      <p className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed">{body}</p>
    </div>
  );
}

function StatusRow({ status }: { status: "Firmado" | "Pendiente" }) {
  return (
    <p className="text-[11px] text-gray-600">
      Estado del registro: <strong>{status}</strong>
    </p>
  );
}
