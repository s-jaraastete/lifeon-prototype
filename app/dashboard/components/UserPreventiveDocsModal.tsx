"use client";

import { useMemo, useState } from "react";
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

type UserPreventiveDocsModalProps = {
  user: PlatformUser;
  onClose: () => void;
};

type DocView =
  | null
  | { type: "irl"; matrixTitle: string; matrixId: string; ack?: IrlAcknowledgement }
  | { type: "reglamento" }
  | { type: "epp" };

export default function UserPreventiveDocsModal({ user, onClose }: UserPreventiveDocsModalProps) {
  const { preferences, updatePreferences } = useLifeOnPreferences();
  const { vigentesMatrices } = useIperMatrices();
  const [docView, setDocView] = useState<DocView>(null);

  const acks = preferences.userPreventiveDocAcknowledgements || [];
  const regAck = getUserPreventiveAck(acks, user.id, "reglamento_interno");
  const eppAck = getUserPreventiveAck(acks, user.id, "epp_entrega");

  const irlEntries = useMemo(() => {
    const cargo = user.cargoName?.trim().toLowerCase();
    if (!cargo) return [];
    return vigentesMatrices
      .map((m) => {
        const list = (m.acknowledgements || []) as IrlAcknowledgement[];
        const ack = findIrlAckForUser(list, user, m.id);
        const evals = m.evaluations || (m as { hazards?: { cargo?: string }[] }).hazards || [];
        const hasCargoInMatrix = Array.isArray(evals)
          ? evals.some((ev) =>
              (ev.cargo || "")
                .split(/[,/;•]/)
                .map((c) => c.trim().toLowerCase())
                .includes(cargo)
            )
          : false;
        if (!hasCargoInMatrix && !ack) return null;
        return {
          matrixId: m.id,
          matrixTitle: m.name || m.title || m.code,
          ack,
        };
      })
      .filter(Boolean) as Array<{ matrixId: string; matrixTitle: string; ack?: IrlAcknowledgement }>;
  }, [vigentesMatrices, user]);

  const markSigned = (kind: "reglamento_interno" | "epp_entrega") => {
    const next = upsertUserPreventiveAck(acks, user.id, kind, "Firmado");
    updatePreferences({ userPreventiveDocAcknowledgements: next });
  };

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

  const printView = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
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
                hint="Requiere matriz vigente con el cargo del trabajador."
                disabled
              />
            ) : (
              irlEntries.map((entry) => (
                <DocCard
                  key={entry.matrixId}
                  icon={LuShieldCheck}
                  title={`IRL — ${entry.matrixTitle}`}
                  status={entry.ack?.status === "Firmado" ? "Firmado" : "Pendiente"}
                  onOpen={() =>
                    setDocView({
                      type: "irl",
                      matrixId: entry.matrixId,
                      matrixTitle: entry.matrixTitle,
                      ack: entry.ack,
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
          <div className="p-5 overflow-y-auto flex flex-col gap-4 print:p-8">
            <button
              type="button"
              onClick={() => setDocView(null)}
              className="text-xs font-semibold text-teal-700 hover:underline self-start cursor-pointer print:hidden"
            >
              ← Volver al listado
            </button>

            {docView.type === "irl" && (
              <>
                <h3 className="text-sm font-bold text-gray-900">IRL — {docView.matrixTitle}</h3>
                <PrintBlock
                  title="Constancia de entrega y toma de conocimiento"
                  body={`Yo, ${fullName}, RUT/ID ${user.identificationNumber || "[COMPLETAR]"}, cargo ${user.cargoName || "[COMPLETAR]"}, declaro haber recibido la Información de Riesgos Laborales asociada a la matriz IPER vigente "${docView.matrixTitle}", conforme al Art. 21 del D.S. N° 40 y gestión de riesgos del D.S. N° 44.`}
                />
                <StatusRow status={docView.ack?.status === "Firmado" ? "Firmado" : "Pendiente"} />
              </>
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
