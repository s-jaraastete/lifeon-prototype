"use client";

import React, { useState, useMemo } from "react";
import clsx from "clsx";
import {
  LuBookOpen,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuX,
  LuTriangleAlert,
  LuChevronDown,
  LuFileText,
  LuClipboardList,
  LuShieldCheck,
  LuOctagonAlert,
  LuScrollText,
  LuSparkles,
  LuAtom,
  LuSend,
} from "react-icons/lu";
import { useTechnicalDocs, DOCUMENT_TYPE_DEFINITIONS } from "@/hooks/useTechnicalDocs";
import { fetchTechnicalDocumentById } from "@/lib/repositories/technicalDocumentsRepository";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { useUsers } from "@/hooks/useUsers";
import { getActiveUser } from "@/lib/auth/authService";
import { assignDocumentDelivery } from "@/lib/repositories/documentDeliveriesRepository";
import { postGenerateTechnicalDocument } from "@/lib/ai/aprVirtualClient";
import {
  DocumentType,
  DocumentStatus,
  TechnicalDocument,
} from "@/types/technicalDocs";

const STATUS_OPTIONS: DocumentStatus[] = ["Borrador", "En Revisión", "Vigente", "Archivado"];

function statusBadge(status: DocumentStatus) {
  const conf: Record<DocumentStatus, string> = {
    Borrador: "bg-slate-100 text-slate-700 border-slate-200",
    "En Revisión": "bg-amber-50 text-amber-700 border-amber-200",
    Vigente: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Archivado: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-full text-[10px] font-bold border",
        conf[status]
      )}
    >
      {status}
    </span>
  );
}

const TYPE_ICONS: Record<DocumentType, React.ReactNode> = {
  RIOHS: <LuScrollText className="w-5 h-5" />,
  PTS: <LuClipboardList className="w-5 h-5" />,
  Instructivo: <LuFileText className="w-5 h-5" />,
  PlanEmergencia: <LuOctagonAlert className="w-5 h-5" />,
  PoliticaSST: <LuShieldCheck className="w-5 h-5" />,
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", iconBg: "bg-red-100 text-red-700" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", iconBg: "bg-blue-100 text-blue-700" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", iconBg: "bg-teal-100 text-teal-700" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", iconBg: "bg-orange-100 text-orange-700" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", iconBg: "bg-purple-100 text-purple-700" },
};

type EditorMode = "create" | "edit";

export default function TechnicalDocsView() {
  const {
    documents,
    createDocument,
    updateDocument,
    deleteDocument,
    getTypeDefinition,
    totalDocsCount,
    draftCount,
    vigentCount,
  } = useTechnicalDocs();
  const { users } = useUsers();

  const [sendDoc, setSendDoc] = useState<TechnicalDocument | null>(null);
  const [sendSelected, setSendSelected] = useState<Set<string>>(new Set());
  const [sendBusy, setSendBusy] = useState(false);

  const [activeType, setActiveType] = useState<DocumentType | "all">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTypeForCreate, setSelectedTypeForCreate] = useState<DocumentType | null>(null);
  const [newDocName, setNewDocName] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editingDoc, setEditingDoc] = useState<TechnicalDocument | null>(null);
  const [editorContent, setEditorContent] = useState<Record<string, string>>({});
  const [editorStatus, setEditorStatus] = useState<DocumentStatus>("Borrador");
  const [isDeleteConfirmId, setIsDeleteConfirmId] = useState<string | null>(null);
  const [openSectionKey, setOpenSectionKey] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiPreviewContent, setAiPreviewContent] = useState<Record<string, string>>({});
  const [aiPreviewDisclaimer, setAiPreviewDisclaimer] = useState("");
  const [aiMergeOnlyEmpty, setAiMergeOnlyEmpty] = useState(true);

  const filteredDocs = useMemo(() => {
    if (activeType === "all") return documents;
    return documents.filter((d) => d.documentType === activeType);
  }, [documents, activeType]);

  const activeWorkers = useMemo(
    () => users.filter((u) => u.status === "Activo"),
    [users]
  );

  const handleOpenSend = (doc: TechnicalDocument) => {
    setSendDoc(doc);
    setSendSelected(new Set());
  };

  const handleConfirmSend = async () => {
    if (!sendDoc || sendSelected.size === 0) return;
    setSendBusy(true);
    const orgId = getActiveUser().orgId;
    let errors = 0;
    for (const memberId of sendSelected) {
      const result = await assignDocumentDelivery({
        organizationId: orgId,
        sourceType: "technical_document",
        sourceId: sendDoc.id,
        assigneeMemberId: memberId,
      });
      if (result.error) errors += 1;
    }
    setSendBusy(false);
    setSendDoc(null);
    if (errors > 0) {
      alert(`Envío completado con ${errors} error(es). Verifica Supabase y permisos.`);
    } else {
      alert("Documento enviado a los trabajadores seleccionados.");
    }
  };

  const handleOpenCreate = (type: DocumentType) => {
    setSelectedTypeForCreate(type);
    setNewDocName("");
    setIsCreateModalOpen(true);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeForCreate || !newDocName.trim()) return;
    const doc = createDocument(selectedTypeForCreate, newDocName.trim());
    setIsCreateModalOpen(false);
    setSelectedTypeForCreate(null);
    setNewDocName("");
    openEditor("create", doc);
  };

  const openEditor = async (mode: EditorMode, doc: TechnicalDocument) => {
    let resolved = doc;
    if (
      isSupabaseConfigured() &&
      (!doc.content || Object.keys(doc.content).length === 0)
    ) {
      const full = await fetchTechnicalDocumentById(doc.organizationId, doc.id);
      if (full) resolved = full;
    }
    setEditorMode(mode);
    setEditingDoc(resolved);
    setEditorContent(resolved.content || {});
    setEditorStatus(resolved.status);
    setOpenSectionKey(null);
    setIsEditorOpen(true);
  };

  const handleSaveEditor = () => {
    if (!editingDoc) return;
    updateDocument(editingDoc.id, { content: editorContent, status: editorStatus });
    setIsEditorOpen(false);
    setEditingDoc(null);
  };

  const handleCloseEditor = () => {
    if (editorMode === "create" && editingDoc) {
      deleteDocument(editingDoc.id);
    }
    setIsEditorOpen(false);
    setEditingDoc(null);
    setAiPreviewOpen(false);
    setAiPreviewContent({});
    setAiError(null);
  };

  const handleGenerateWithAi = async () => {
    if (!editingDoc || !typeDef) return;
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const result = await postGenerateTechnicalDocument({
        documentType: editingDoc.documentType,
        documentName: editingDoc.name,
        sections: typeDef.sections.map((s) => ({
          key: s.key,
          label: s.label,
          required: s.required,
          placeholder: s.placeholder,
        })),
      });
      setAiPreviewContent(result.sections);
      setAiPreviewDisclaimer(result.disclaimer);
      setAiPreviewOpen(true);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "No se pudo generar el borrador.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyAiPreview = () => {
    setEditorContent((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(aiPreviewContent)) {
        if (aiMergeOnlyEmpty && prev[key]?.trim()) continue;
        next[key] = value;
      }
      return next;
    });
    if (editorStatus === "Borrador") {
      setEditorStatus("En Revisión");
    }
    setAiPreviewOpen(false);
    setAiPreviewContent({});
  };

  const typeDef = editingDoc ? getTypeDefinition(editingDoc.documentType) : null;

  const inReviewCount = useMemo(() => documents.filter((d) => d.status === "En Revisión").length, [documents]);

  return (
    <div className="flex flex-col gap-4 font-[family-name:var(--font-poppins)] select-none">
      {/* Header */}
      <section className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
            <LuBookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Documentación Técnica
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Administra los documentos técnicos de SST de tu organización.
            </p>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
            <LuBookOpen className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalDocsCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">Documentos registrados</span>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Vigentes</span>
            <LuShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{vigentCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">Aprobados y vigentes</span>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Borradores</span>
            <LuPencil className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{draftCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">En elaboración</span>
        </div>
      </section>

      {/* Type Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DOCUMENT_TYPE_DEFINITIONS.map((typeDef) => {
          const colors = COLOR_MAP[typeDef.colorClass] || COLOR_MAP.blue;
          const count = documents.filter((d) => d.documentType === typeDef.type).length;
          return (
            <div
              key={typeDef.type}
              className={clsx(
                "rounded-2xl border p-5 flex flex-col gap-3 transition",
                colors.bg,
                colors.border
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", colors.iconBg)}>
                  {TYPE_ICONS[typeDef.type]}
                </div>
                <span className="text-[11px] font-bold text-gray-500">{count} doc{count !== 1 ? "s" : ""}</span>
              </div>
              <div>
                <h3 className={clsx("text-sm font-bold", colors.text)}>{typeDef.label}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{typeDef.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCreate(typeDef.type)}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition mt-auto cursor-pointer",
                  colors.text,
                  colors.border,
                  "bg-white/70 hover:bg-white"
                )}
              >
                <LuPlus className="w-3.5 h-3.5" />
                Nuevo documento
              </button>
            </div>
          );
        })}
      </section>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveType("all")}
          className={clsx(
            "px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0",
            activeType === "all" ? "bg-gray-100 text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
          )}
        >
          Todos ({totalDocsCount})
        </button>
        {DOCUMENT_TYPE_DEFINITIONS.map((td) => {
          const c = documents.filter((d) => d.documentType === td.type).length;
          return (
            <button
              key={td.type}
              type="button"
              onClick={() => setActiveType(td.type)}
              className={clsx(
                "px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0",
                activeType === td.type ? "bg-gray-100 text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
              )}
            >
              {td.type === "PlanEmergencia" ? "Emergencia" : td.type === "PoliticaSST" ? "Política SST" : td.type} ({c})
            </button>
          );
        })}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 mx-auto mb-4">
              <LuBookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {totalDocsCount === 0 ? "Sin documentos" : "Sin resultados para este tipo"}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {totalDocsCount === 0
                ? "Crea tu primer documento técnico usando las tarjetas de tipo de documento."
                : "Selecciona 'Todos' o crea un documento de este tipo."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Documento</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Última actualización</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocs.map((doc) => {
                  const def = getTypeDefinition(doc.documentType);
                  const colors = def ? COLOR_MAP[def.colorClass] || COLOR_MAP.blue : COLOR_MAP.blue;
                  const sectionsFilled = def
                    ? def.sections.filter((s) => doc.content?.[s.key]?.trim()).length
                    : 0;
                  const totalSections = def?.sections.length || 0;

                  return (
                    <tr key={doc.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", colors.iconBg)}>
                            {TYPE_ICONS[doc.documentType]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{doc.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {sectionsFilled}/{totalSections} secciones completadas
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={clsx("px-2 py-0.5 rounded-lg text-[11px] font-semibold border", colors.bg, colors.text, colors.border)}>
                          {def?.type === "PlanEmergencia"
                            ? "Plan Emergencia"
                            : def?.type === "PoliticaSST"
                            ? "Política SST"
                            : def?.type || doc.documentType}
                        </span>
                      </td>
                      <td className="py-3 px-4">{statusBadge(doc.status)}</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-gray-500">
                          {new Date(doc.updatedAt).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.status === "Vigente" ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSend(doc)}
                              className="p-1.5 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 transition"
                              title="Enviar a trabajadores"
                            >
                              <LuSend className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openEditor("edit", doc)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                            title="Editar documento"
                          >
                            <LuPencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsDeleteConfirmId(doc.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 transition"
                            title="Eliminar documento"
                          >
                            <LuTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE DOC NAME MODAL */}
      {isCreateModalOpen && selectedTypeForCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Nuevo Documento</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>
            {(() => {
              const def = DOCUMENT_TYPE_DEFINITIONS.find((d) => d.type === selectedTypeForCreate);
              const colors = def ? COLOR_MAP[def.colorClass] || COLOR_MAP.blue : COLOR_MAP.blue;
              return (
                <>
                  <div className={clsx("flex items-center gap-2 p-3 rounded-xl mb-4", colors.bg, colors.border, "border")}>
                    <span className={clsx("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", colors.iconBg)}>
                      {TYPE_ICONS[selectedTypeForCreate]}
                    </span>
                    <div>
                      <p className={clsx("text-xs font-bold", colors.text)}>{def?.label}</p>
                      <p className="text-[11px] text-gray-500">{def?.description}</p>
                    </div>
                  </div>
                  <form onSubmit={handleConfirmCreate}>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Nombre del Documento *
                    </label>
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder={
                        selectedTypeForCreate === "PTS"
                          ? "Ej: PTS-001 Trabajo en Altura"
                          : selectedTypeForCreate === "Instructivo"
                          ? "Ej: ITS-001 Uso de Amoladora Angular"
                          : selectedTypeForCreate === "RIOHS"
                          ? "Ej: RIOHS 2025"
                          : selectedTypeForCreate === "PlanEmergencia"
                          ? "Ej: Plan de Emergencia Faena Norte"
                          : "Ej: Política SST 2025"
                      }
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 mb-4"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newDocName.trim()}
                        className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                      >
                        Crear y editar
                      </button>
                    </div>
                  </form>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <LuTriangleAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Eliminar Documento</h3>
                <p className="text-xs text-gray-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDocument(isDeleteConfirmId);
                  setIsDeleteConfirmId(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT EDITOR MODAL */}
      {isEditorOpen && editingDoc && typeDef && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl my-8 shadow-2xl border border-gray-100">
            {/* Editor header */}
            <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {(() => {
                  const colors = COLOR_MAP[typeDef.colorClass] || COLOR_MAP.blue;
                  return (
                    <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", colors.iconBg)}>
                      {TYPE_ICONS[editingDoc.documentType]}
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{editingDoc.name}</p>
                  <p className="text-[11px] text-gray-500">{typeDef.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={editorStatus}
                  onChange={(e) => setEditorStatus(e.target.value as DocumentStatus)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCloseEditor}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  <LuX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sections */}
            <div className="px-6 pt-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl border border-violet-200 bg-violet-50/60">
                <div className="flex items-start gap-2">
                  <LuAtom className="w-4 h-4 text-violet-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-violet-950">APR Virtual IA</p>
                    <p className="text-[11px] text-violet-900/80">
                      Genera un borrador por secciones. Tú revisas, editas y guardas cuando esté listo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={() => void handleGenerateWithAi()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <LuSparkles className="w-3.5 h-3.5" />
                  {isGeneratingAi ? "Generando borrador…" : "Generar contenido con IA"}
                </button>
              </div>
              {aiError && (
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  {aiError}
                </p>
              )}
              {isGeneratingAi && (
                <p className="text-[11px] text-violet-700 animate-pulse">
                  APR Virtual está preparando el borrador del documento…
                </p>
              )}
            </div>

            <div className="p-6 pt-2 flex flex-col gap-3">
              {typeDef.sections.map((section) => {
                const isOpen = openSectionKey === section.key;
                const hasContent = !!editorContent[section.key]?.trim();

                return (
                  <div
                    key={section.key}
                    className={clsx(
                      "border rounded-2xl overflow-hidden transition",
                      hasContent ? "border-teal-200" : "border-gray-200"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenSectionKey(isOpen ? null : section.key)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={clsx(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            hasContent ? "bg-teal-500" : "bg-gray-300"
                          )}
                        />
                        <span className="text-xs font-bold text-gray-800">{section.label}</span>
                        {section.required && (
                          <span className="text-[10px] text-red-500 font-semibold">*</span>
                        )}
                      </div>
                      <LuChevronDown
                        className={clsx("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        {section.multiline ? (
                          <textarea
                            value={editorContent[section.key] || ""}
                            onChange={(e) =>
                              setEditorContent((prev) => ({ ...prev, [section.key]: e.target.value }))
                            }
                            placeholder={section.placeholder}
                            rows={section.rows || 4}
                            className="w-full px-3.5 py-2.5 mt-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-y"
                          />
                        ) : (
                          <input
                            type="text"
                            value={editorContent[section.key] || ""}
                            onChange={(e) =>
                              setEditorContent((prev) => ({ ...prev, [section.key]: e.target.value }))
                            }
                            placeholder={section.placeholder}
                            className="w-full px-3.5 py-2.5 mt-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Editor footer */}
            <div className="sticky bottom-0 bg-white rounded-b-3xl border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3">
              <p className="text-[11px] text-gray-400">
                {typeDef.sections.filter((s) => editorContent[s.key]?.trim()).length}/
                {typeDef.sections.length} secciones completadas
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseEditor}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditor}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  Guardar Documento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI PREVIEW MODAL */}
      {aiPreviewOpen && editingDoc && typeDef && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-violet-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <LuSparkles className="w-4 h-4 text-violet-600" />
                  Revisar borrador — APR Virtual IA
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{editingDoc.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAiPreviewOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>
            <p className="px-6 py-2 text-[11px] text-amber-900 bg-amber-50 border-b border-amber-100">
              {aiPreviewDisclaimer ||
                "Borrador sugerido para revisión profesional. No constituye aprobación legal."}
            </p>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
              {typeDef.sections.map((section) => {
                const text = aiPreviewContent[section.key];
                if (!text?.trim()) return null;
                return (
                  <div key={section.key} className="border border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-gray-800 mb-2">{section.label}</p>
                    <p className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed">
                      {text}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiMergeOnlyEmpty}
                  onChange={(e) => setAiMergeOnlyEmpty(e.target.checked)}
                  className="accent-violet-600"
                />
                Aplicar solo en secciones vacías
              </label>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setAiPreviewOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={handleApplyAiPreview}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Aplicar al editor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {sendDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Enviar documento a trabajadores</h3>
              <button type="button" onClick={() => setSendDoc(null)} className="p-1.5 text-gray-400">
                <LuX className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-3">{sendDoc.name}</p>
            <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl divide-y">
              {activeWorkers.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-3 text-xs cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={sendSelected.has(u.id)}
                    onChange={(e) => {
                      setSendSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(u.id);
                        else next.delete(u.id);
                        return next;
                      });
                    }}
                  />
                  <span className="font-semibold text-gray-900">
                    {u.firstName} {u.lastName}
                  </span>
                  <span className="text-gray-500">{u.email}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={sendBusy || sendSelected.size === 0}
              onClick={handleConfirmSend}
              className="mt-4 w-full py-3 rounded-xl bg-teal-600 text-white font-bold text-sm disabled:opacity-40"
            >
              {sendBusy ? "Enviando…" : `Enviar a ${sendSelected.size} trabajador(es)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
