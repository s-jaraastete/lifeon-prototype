"use client";

import { useState, useMemo, useEffect } from "react";
import clsx from "clsx";
import {
  LuX,
  LuPrinter,
  LuFileText,
  LuCircleCheck,
  LuClock,
  LuBriefcase,
  LuSearch,
  LuUserCheck,
} from "react-icons/lu";
import { IperMatrixItem } from "./IperMatrixView";
import { IperEvaluationRow } from "./IperMatrixDetailView";
import { useUsers } from "@/hooks/useUsers";
import {
  IrlAcknowledgement,
  IrlAcknowledgementStatus,
} from "@/types/irlAcknowledgements";
import { getActiveUser } from "@/lib/auth/authService";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import IrlFormalDocument from "./IrlFormalDocument";
import { buildIrlDocumentCode, IRL_LEGAL_BADGE, parseIrlSnapshot } from "@/lib/irl/irlDocumentCopy";
import { createSignatureSignedUrl } from "@/lib/repositories/ackEvidenceRepository";
import {
  assignDocumentDelivery,
  DocumentDeliveryRow,
  fetchDeliveriesForSource,
  fetchSignedIrlDeliveryForMember,
  type DocumentDeliveryDetail,
} from "@/lib/repositories/documentDeliveriesRepository";
import { scopedIperMatrixId } from "@/lib/utils/iperMatrixPersistence";
import { saveIperMatrixToSupabase } from "@/lib/services/supabaseService";

interface IrlDocumentModalProps {
  matrix: IperMatrixItem;
  evaluations: IperEvaluationRow[];
  onClose: () => void;
  initialPosition?: string;
  acknowledgements?: IrlAcknowledgement[];
  onAcknowledgementsChange?: (acks: IrlAcknowledgement[]) => void;
}

export default function IrlDocumentModal({
  matrix,
  evaluations,
  onClose,
  initialPosition,
  acknowledgements = [],
  onAcknowledgementsChange,
}: IrlDocumentModalProps) {
  const { users } = useUsers();
  const { preferences } = useLifeOnPreferences();
  const organizationName = preferences.organizationName?.trim() || "Empresa";
  const organizationLogoUrl = preferences.organizationLogo ?? null;
  // Extraer cargos disponibles EXCLUSIVAMENTE de las evaluaciones reales de la matriz (Reqs 3, 4, 7)
  const availablePositions = useMemo(() => {
    const uniquePositions = new Set<string>();
    evaluations.forEach((ev) => {
      if (ev.cargo && typeof ev.cargo === "string") {
        ev.cargo
          .split(/[,/;•]/)
          .map((c) => c.trim())
          .filter(Boolean)
          .forEach((cargo) => uniquePositions.add(cargo));
      }
    });
    return Array.from(uniquePositions).sort((a, b) => a.localeCompare(b));
  }, [evaluations]);

  const [selectedPosition, setSelectedPosition] = useState<string>(
    () => initialPosition || availablePositions[0] || ""
  );

  // Sincronizar posición seleccionada si cambian las evaluaciones
  useEffect(() => {
    if (availablePositions.length > 0 && (!selectedPosition || !availablePositions.includes(selectedPosition))) {
      setSelectedPosition(availablePositions[0]);
    }
  }, [availablePositions, selectedPosition]);

  const [activeTab, setActiveTab] = useState<"document" | "signatures">("document");
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveries, setDeliveries] = useState<DocumentDeliveryRow[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [previewWorkerId, setPreviewWorkerId] = useState<string | null>(null);
  const [previewDelivery, setPreviewDelivery] = useState<DocumentDeliveryDetail | null>(null);
  const [previewSignatureUrl, setPreviewSignatureUrl] = useState<string | null>(null);

  const organizationId = getActiveUser().orgId;
  const deliverySourceId = useMemo(
    () => scopedIperMatrixId(matrix.id, organizationId),
    [matrix.id, organizationId]
  );

  useEffect(() => {
    if (!previewWorkerId) {
      setPreviewDelivery(null);
      setPreviewSignatureUrl(null);
      return;
    }
    let cancelled = false;
    fetchSignedIrlDeliveryForMember(organizationId, deliverySourceId, previewWorkerId).then(
      async (delivery) => {
        if (cancelled) return;
        setPreviewDelivery(delivery);
        if (delivery?.signature_path) {
          setPreviewSignatureUrl(await createSignatureSignedUrl(delivery.signature_path));
        } else {
          setPreviewSignatureUrl(null);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [previewWorkerId, organizationId, deliverySourceId]);

  useEffect(() => {
    let cancelled = false;
    fetchDeliveriesForSource(organizationId, "irl", deliverySourceId).then((rows) => {
      if (!cancelled) setDeliveries(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, deliverySourceId]);

  const getDeliveryForUser = (userId: string): DocumentDeliveryRow | undefined =>
    deliveries.find(
      (d) =>
        d.assignee_member_id === userId &&
        d.source_id === deliverySourceId &&
        (d.cargo_name === selectedPosition || !d.cargo_name)
    );

  const workersForCargo = useMemo(() => {
    if (!selectedPosition) return [];
    const target = selectedPosition.trim().toLowerCase();
    return users.filter((u) => {
      if (u.status !== "Activo") return false;
      const name = u.cargoName?.trim().toLowerCase();
      if (!name) return false;
      return name === target || name.includes(target) || target.includes(name);
    });
  }, [users, selectedPosition]);

  const getAckForUser = (userId: string): IrlAcknowledgement | undefined =>
    acknowledgements.find(
      (a) => a.userId === userId && a.cargoName === selectedPosition && a.matrixId === matrix.id
    );

  const upsertAck = (partial: Omit<IrlAcknowledgement, "updatedAt">) => {
    const now = new Date().toISOString();
    const existing = acknowledgements.find((a) => a.id === partial.id);
    const next: IrlAcknowledgement = {
      ...(existing || partial),
      ...partial,
      updatedAt: now,
    };
    const list = existing
      ? acknowledgements.map((a) => (a.id === partial.id ? next : a))
      : [...acknowledgements, next];
    onAcknowledgementsChange?.(list);
  };

  const handleSendIrlForUser = async (userId: string, userName: string, rut?: string) => {
    setSendError(null);
    await saveIperMatrixToSupabase(
      {
        ...matrix,
        evaluations,
        hazards: evaluations,
        status: matrix.status,
      },
      organizationId
    );
    const remote = await assignDocumentDelivery({
      organizationId,
      sourceType: "irl",
      sourceId: deliverySourceId,
      assigneeMemberId: userId,
      cargoName: selectedPosition,
    });

    if (remote.id) {
      const rows = await fetchDeliveriesForSource(organizationId, "irl", deliverySourceId);
      setDeliveries(rows);
      return;
    }

    if (remote.error) {
      setSendError(remote.error);
    }

    const id = getAckForUser(userId)?.id || `ack-${matrix.id}-${userId}-${Date.now()}`;
    upsertAck({
      id,
      matrixId: matrix.id,
      cargoName: selectedPosition,
      userId,
      userName,
      identificationNumber: rut,
      status: "Enviado",
      sentAt: new Date().toISOString(),
      acknowledgedAt: null,
    });
  };

  const handleRegisterKnowledge = (userId: string, userName: string, rut?: string) => {
    const existing = getAckForUser(userId);
    const id = existing?.id || `ack-${matrix.id}-${userId}-${Date.now()}`;
    upsertAck({
      id,
      matrixId: matrix.id,
      cargoName: selectedPosition,
      userId,
      userName,
      identificationNumber: rut,
      status: "Firmado",
      sentAt: existing?.sentAt || new Date().toISOString(),
      acknowledgedAt: new Date().toISOString(),
    });
  };

  const handleSendAllPending = async () => {
    for (const u of workersForCargo) {
      const delivery = getDeliveryForUser(u.id);
      const ack = getAckForUser(u.id);
      const alreadySent =
        delivery &&
        (delivery.status === "pendiente_revision" ||
          delivery.status === "pendiente_firma" ||
          delivery.status === "firmado");
      if (alreadySent || ack?.status === "Enviado" || ack?.status === "Firmado") {
        continue;
      }
      await handleSendIrlForUser(
        u.id,
        `${u.firstName} ${u.lastName}`.trim(),
        u.identificationNumber
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtrar evaluaciones relevantes EXCLUSIVAMENTE para el cargo seleccionado (Reqs 4, 5, 7)
  const positionEvaluations = useMemo(() => {
    if (!selectedPosition || evaluations.length === 0) return [];
    const target = selectedPosition.trim().toLowerCase();
    return evaluations.filter((ev) => {
      if (!ev.cargo) return false;
      const cargos = ev.cargo.split(/[,/;•]/).map((c) => c.trim().toLowerCase());
      return cargos.includes(target) || ev.cargo.toLowerCase().includes(target);
    });
  }, [evaluations, selectedPosition]);

  const workerRows = useMemo(() => {
    return workersForCargo.map((u) => {
      const delivery = getDeliveryForUser(u.id);
      const ack = getAckForUser(u.id);
      let status: IrlAcknowledgementStatus = ack?.status ?? "Pendiente";
      if (delivery?.status === "firmado") status = "Firmado";
      else if (
        delivery &&
        (delivery.status === "pendiente_revision" || delivery.status === "pendiente_firma")
      ) {
        status = "Enviado";
      }
      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        rut: u.identificationNumber || "—",
        position: u.cargoName || selectedPosition,
        sentAt: delivery?.assigned_at ?? ack?.sentAt,
        acknowledgedAt: delivery?.signed_at ?? ack?.acknowledgedAt,
        status,
      };
    });
  }, [workersForCargo, acknowledgements, selectedPosition, matrix.id, deliveries]);

  const filteredSignatures = workerRows.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const signedCount = workerRows.filter((w) => w.status === "Firmado").length;
  const signatureProgress = Math.round((signedCount / (workerRows.length || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden font-[family-name:var(--font-poppins)] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* 1. Header del Modal con Branding LifeOn */}
        <div className="bg-white border-b border-gray-200 text-gray-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center flex-shrink-0">
              <LuFileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold tracking-tight text-gray-900">
                  Información de Riesgos Laborales (IRL)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  {IRL_LEGAL_BADGE}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Documento IRL del cargo · Fuente técnica: Matriz IPER{" "}
                <strong className="text-teal-700 font-mono">{matrix.code}</strong> ({matrix.name})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition cursor-pointer shadow-xs"
              title="Imprimir documento IRL"
            >
              <LuPrinter className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Documento</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Barra de Navegación del Modal e Indicadores de Cargo */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-700 whitespace-nowrap flex items-center gap-1.5">
              <LuBriefcase className="w-4 h-4 text-teal-600" />
              Seleccionar Cargo / Puesto:
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="bg-white border border-teal-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
            >
              {availablePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-gray-200/80 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("document")}
                className={clsx(
                  "px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5",
                  activeTab === "document"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <LuFileText className="w-3.5 h-3.5 text-teal-600" />
                Información de Riesgos Laborales (IRL)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("signatures")}
                className={clsx(
                  "px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5",
                  activeTab === "signatures"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <LuUserCheck className="w-3.5 h-3.5 text-teal-600" />
                Toma de Conocimiento ({signedCount}/{workerRows.length})
              </button>
            </div>
          </div>
        </div>

        {/* 3. Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50">
          {activeTab === "document" ? (
            <div className="w-full flex flex-col items-center gap-3 px-1 sm:px-2">
              {previewWorkerId && previewDelivery ? (
                <p className="text-xs text-teal-800 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2 print:hidden">
                  Vista del IRL firmado (versión enviada al trabajador).{" "}
                  <button
                    type="button"
                    className="font-bold underline cursor-pointer"
                    onClick={() => setPreviewWorkerId(null)}
                  >
                    Volver a plantilla del cargo
                  </button>
                </p>
              ) : null}
              {previewDelivery?.status === "firmado" ? (
                (() => {
                  const snap = parseIrlSnapshot(previewDelivery.content_snapshot ?? {});
                  const worker = workersForCargo.find((u) => u.id === previewWorkerId);
                  return (
                    <IrlFormalDocument
                      organizationName={snap.organizationName || organizationName}
                      organizationLogoUrl={snap.organizationLogoUrl ?? organizationLogoUrl}
                      matrixCode={snap.matrixCode || matrix.code}
                      matrixTitle={snap.matrixTitle || matrix.name}
                      workCenterName={snap.workCenterName || matrix.workCenter}
                      cargoName={snap.cargoName || selectedPosition}
                      responsible={snap.responsible || matrix.responsible}
                      evaluations={snap.evaluations || []}
                      documentCode={snap.documentCode || previewDelivery.document_code || undefined}
                      issuedAt={snap.issuedAt || previewDelivery.assigned_at}
                      workerSignature={{
                        fullName:
                          snap.assigneeFullName ||
                          (worker ? `${worker.firstName} ${worker.lastName}`.trim() : undefined),
                        identificationNumber:
                          snap.assigneeIdentificationNumber || worker?.identificationNumber,
                        signedAt: previewDelivery.signed_at,
                        imageUrl: previewSignatureUrl,
                      }}
                    />
                  );
                })()
              ) : (
                <IrlFormalDocument
                  organizationName={organizationName}
                  organizationLogoUrl={organizationLogoUrl}
                  matrixCode={matrix.code}
                  matrixTitle={matrix.name}
                  workCenterName={matrix.workCenter}
                  cargoName={selectedPosition}
                  responsible={matrix.responsible}
                  evaluations={positionEvaluations}
                  documentCode={buildIrlDocumentCode(matrix.code, selectedPosition)}
                />
              )}
            </div>
          ) : (
            /* PANEL DE CONTROL DE FIRMAS Y ENTREGAS */
            <div className="max-w-4xl mx-auto flex flex-col gap-4">
              {sendError ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                  {sendError}
                </p>
              ) : null}
              {/* Tarjeta de Progreso de Firmas */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-black text-base flex-shrink-0">
                    {signatureProgress}%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Toma de Conocimiento del IRL</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Trabajadores del cargo <strong>{selectedPosition}</strong> según módulo Usuarios.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSendAllPending}
                    disabled={workersForCargo.length === 0}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 cursor-pointer"
                  >
                    Enviar IRL para firma
                  </button>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {signedCount} Firmados
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {workerRows.length - signedCount} Pendientes
                  </span>
                </div>
              </div>

              {/* Buscador y Tabla de Trabajadores */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[240px]">
                    <LuSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, RUT o cargo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <span className="text-xs text-gray-500">
                    Mostrando {filteredSignatures.length} registros
                  </span>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 text-[11px]">
                        <th className="p-3">Trabajador / RUT</th>
                        <th className="p-3">Cargo Asignado</th>
                        <th className="p-3">Envío / Toma</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSignatures.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-xs text-gray-500">
                            No hay usuarios activos con el cargo &quot;{selectedPosition}&quot; en el módulo Usuarios.
                          </td>
                        </tr>
                      )}
                      {filteredSignatures.map((w) => (
                        <tr key={w.id} className="hover:bg-gray-50/60">
                          <td className="p-3">
                            <p className="font-bold text-gray-900">{w.name}</p>
                            <p className="text-[11px] text-gray-500 font-mono">{w.rut}</p>
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-gray-800">{w.position}</span>
                          </td>
                          <td className="p-3 text-gray-600 font-mono text-[11px]">
                            {w.acknowledgedAt
                              ? new Date(w.acknowledgedAt).toLocaleDateString("es-CL")
                              : w.sentAt
                              ? new Date(w.sentAt).toLocaleDateString("es-CL")
                              : "—"}
                          </td>
                          <td className="p-3">
                            <span
                              className={clsx(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                w.status === "Firmado"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : w.status === "Enviado"
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              )}
                            >
                              {w.status === "Firmado" ? (
                                <>
                                  <LuCircleCheck className="w-3 h-3" /> Firmado
                                </>
                              ) : w.status === "Enviado" ? (
                                <>
                                  <LuClock className="w-3 h-3" /> Enviado
                                </>
                              ) : (
                                <>
                                  <LuClock className="w-3 h-3" /> Pendiente
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-3 text-right flex flex-col gap-1 items-end">
                            {w.status === "Firmado" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewWorkerId(w.id);
                                  setActiveTab("document");
                                }}
                                className="px-3 py-1 text-[11px] font-semibold text-teal-900 bg-white hover:bg-teal-50 border border-teal-200 rounded-xl transition cursor-pointer"
                              >
                                Ver IRL firmado
                              </button>
                            ) : null}
                            {w.status !== "Firmado" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSendIrlForUser(w.id, w.name, w.rut)}
                                  className="px-3 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition cursor-pointer"
                                >
                                  Enviar IRL
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRegisterKnowledge(w.id, w.name, w.rut)}
                                  className="px-3 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
                                >
                                  Registrar toma
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
