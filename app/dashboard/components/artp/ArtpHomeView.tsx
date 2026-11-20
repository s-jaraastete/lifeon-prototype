"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  LuPlus,
  LuClipboardList,
  LuEye,
  LuPencil,
  LuCopy,
  LuFilter,
  LuTrash2,
} from "react-icons/lu";
import LoadingState from "@/components/reusable/LoadingState";
import {
  useArtpDocuments,
  useArtpHomeCounts,
  useArtpOrgId,
} from "@/hooks/useArtp";
import type { ArtpDocumentListItem, ArtpVersionStatus } from "@/types/artp";
import { ArtpWizard } from "./ArtpWizard";
import { ArtpDetailView } from "./ArtpDetailView";
import { cloneArtpVersion, deleteArtpDraftDocument } from "@/lib/repositories/artpRepository";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { useUsers } from "@/hooks/useUsers";

const STATUS_LABEL: Record<ArtpVersionStatus, string> = {
  borrador: "Borrador",
  en_revision: "Pendiente de firmas",
  vigente: "Vigente",
  archivado: "Archivado",
};

type ViewMode =
  | { kind: "home" }
  | { kind: "detail"; versionId: string };

export interface ArtpPrefillFromIper {
  taskName: string;
  matrixId?: string;
  workCenterId?: string;
  areaId?: string;
  processId?: string;
  subprocessId?: string;
  positionIds?: string[];
}

interface ArtpHomeViewProps {
  initialPrefill?: ArtpPrefillFromIper | null;
  onClearPrefill?: () => void;
}

export default function ArtpHomeView({ initialPrefill, onClearPrefill }: ArtpHomeViewProps) {
  const orgId = useArtpOrgId();
  const { currentUser } = useLifeOnPreferences();
  const { users } = useUsers();
  const myRole = users.find((u) => u.email === currentUser?.email)?.role;
  const isEditor = myRole !== "Lector";

  const [view, setView] = useState<ViewMode>({ kind: "home" });
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPrefill, setWizardPrefill] = useState<ArtpPrefillFromIper | undefined>();
  const [editVersionId, setEditVersionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ArtpVersionStatus | "">("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (initialPrefill?.taskName) {
      setWizardPrefill(initialPrefill);
      setWizardOpen(true);
    }
  }, [initialPrefill]);

  const { data: counts, isLoading: countsLoading } = useArtpHomeCounts();
  const { data: docs = [], isLoading: docsLoading, refetch } = useArtpDocuments();

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (statusFilter && d.versionStatus !== statusFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.taskName.toLowerCase().includes(q) ||
        (d.code ?? "").toLowerCase().includes(q)
      );
    });
  }, [docs, statusFilter, search]);

  const openWizard = (prefill?: ArtpPrefillFromIper, versionIdToEdit?: string | null) => {
    setWizardPrefill(prefill ?? initialPrefill ?? undefined);
    setEditVersionId(versionIdToEdit ?? null);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setWizardPrefill(undefined);
    setEditVersionId(null);
    onClearPrefill?.();
    void refetch();
  };

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);

  const handleDeleteDraft = async (documentId: string, label: string) => {
    const confirmed = window.confirm(
      `¿Eliminar el ARTP «${label}»? Se quitará del listado y de la aplicación. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    setDeleteError(null);
    const result = await deleteArtpDraftDocument(documentId);
    if (!result.ok) {
      setDeleteError(result.message);
      return;
    }
    if (view.kind === "detail") {
      setView({ kind: "home" });
    }
    void refetch();
  };

  if (view.kind === "detail") {
    return (
      <div className="flex flex-col gap-3 font-[family-name:var(--font-poppins)] animate-in fade-in duration-300 p-4 md:p-6">
        {deleteError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {deleteError}
          </p>
        )}
        <ArtpDetailView
          versionId={view.versionId}
          onBack={() => setView({ kind: "home" })}
          onRefreshList={() => void refetch()}
          onDeleteDraft={
            isEditor
              ? (documentId, label) => void handleDeleteDraft(documentId, label)
              : undefined
          }
          onEdit={
            isEditor
              ? () => openWizard(undefined, view.versionId)
              : undefined
          }
        />
        <ArtpWizard
          open={wizardOpen}
          orgId={orgId}
          prefill={wizardPrefill}
          editVersionId={editVersionId}
          onClose={closeWizard}
          onSaved={(versionId) => {
            closeWizard();
            setView({ kind: "detail", versionId });
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 font-[family-name:var(--font-poppins)] animate-in fade-in duration-300 relative p-4 md:p-6">
      {deleteError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {deleteError}
        </p>
      )}
      {versionError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {versionError}
        </p>
      )}
      <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
            <LuClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">ARTP</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Análisis de Riesgo de la Tarea Planificada. Crea el documento, solicita las firmas y publícalo como vigente.
            </p>
          </div>
        </div>
        {isEditor && (
          <button
            type="button"
            onClick={() => openWizard(initialPrefill ?? undefined)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#F04438] hover:bg-[#D92D20] shadow-xs transition cursor-pointer"
          >
            <LuPlus className="w-4 h-4" /> Crear ARTP
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Vigentes", value: counts?.vigente ?? 0 },
          { label: "Borradores", value: counts?.borrador ?? 0 },
          { label: "Pendiente de firmas", value: counts?.enRevision ?? 0 },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {countsLoading ? "—" : kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <LuFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar por nombre o tarea…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ArtpVersionStatus | "")}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {docsLoading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-gray-700 font-medium">Aún no hay ARTP registrados</p>
          <p className="text-sm text-gray-500 mt-2">
            Crea un ARTP, envíalo a firma y, cuando todos firmen, quedará vigente.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tarea</th>
                <th className="px-4 py-3">Versión</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <ArtpRow
                  key={row.id}
                  row={row}
                  isEditor={isEditor}
                  versionBusy={cloningId === row.id}
                  onView={() =>
                    row.currentVersionId &&
                    setView({ kind: "detail", versionId: row.currentVersionId })
                  }
                  onVersion={async () => {
                    if (!row.currentVersionId || cloningId) return;
                    setVersionError(null);
                    setCloningId(row.id);
                    const result = await cloneArtpVersion(row.currentVersionId);
                    setCloningId(null);
                    if (!result.versionId) {
                      setVersionError(result.message ?? "No se pudo crear la nueva versión.");
                      return;
                    }
                    void refetch();
                    openWizard(undefined, result.versionId);
                  }}
                  onEdit={() => {
                    if (row.currentVersionId) {
                      openWizard(undefined, row.currentVersionId);
                    }
                  }}
                  onDelete={
                    isEditor ? () => void handleDeleteDraft(row.id, row.name) : undefined
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ArtpWizard
        open={wizardOpen}
        orgId={orgId}
        prefill={wizardPrefill}
        editVersionId={editVersionId}
        onClose={closeWizard}
        onSaved={(versionId) => {
          closeWizard();
          setView({ kind: "detail", versionId });
        }}
      />
    </div>
  );
}

function ArtpRow({
  row,
  isEditor,
  versionBusy,
  onView,
  onVersion,
  onEdit,
  onDelete,
}: {
  row: ArtpDocumentListItem;
  isEditor: boolean;
  versionBusy?: boolean;
  onView: () => void;
  onVersion: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const status = row.versionStatus;
  return (
    <tr className="hover:bg-gray-50/80">
      <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
      <td className="px-4 py-3 text-gray-600">{row.taskName}</td>
      <td className="px-4 py-3">{row.versionNumber ?? "—"}</td>
      <td className="px-4 py-3">
        {status ? (
          <span
            className={clsx(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
              status === "vigente" && "bg-teal-100 text-teal-800",
              status === "borrador" && "bg-gray-100 text-gray-700",
              status === "en_revision" && "bg-amber-100 text-amber-800",
              status === "archivado" && "bg-slate-100 text-slate-600"
            )}
          >
            {STATUS_LABEL[status]}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3 text-gray-500">
        {new Date(row.updatedAt).toLocaleDateString("es-CL")}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onView}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            title={status === "vigente" ? "Ver PDF firmado" : "Ver"}
          >
            <LuEye />
          </button>
          {isEditor && status === "vigente" && (
            <button
              type="button"
              onClick={onVersion}
              disabled={versionBusy}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-50"
              title={versionBusy ? "Creando versión…" : "Nueva versión"}
            >
              <LuCopy />
            </button>
          )}
          {isEditor && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-50 text-red-700"
              title="Eliminar"
            >
              <LuTrash2 />
            </button>
          )}
          {isEditor && (status === "borrador" || status === "en_revision") && (
            <button
              type="button"
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              title="Ver / editar"
            >
              <LuPencil />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
