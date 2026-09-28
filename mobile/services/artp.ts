import { getSupabase } from "./supabase";
import type { ArtpExecutionSummary } from "@/types/models";

const EXECUTION_COLUMNS =
  "id, organization_id, artp_version_id, code, status, specific_location, starts_on, started_at, ended_at";

export type MyArtpDocument = {
  versionId: string;
  taskName: string;
  versionNumber: number;
  documentStatus: string;
  deliveryId: string;
  mySignatureStatus: string;
  assigneeRole: string;
  title: string;
};

export async function fetchMyArtpDocuments(): Promise<MyArtpDocument[]> {
  const client = getSupabase();
  if (!client) return [];
  const { data, error } = await client.rpc("list_my_artp_documents");
  if (error || data == null) return [];
  const rows = Array.isArray(data)
    ? data
    : typeof data === "string"
      ? (JSON.parse(data) as unknown[])
      : [];
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      versionId: String(item.versionId ?? ""),
      taskName: String(item.taskName ?? item.title ?? "ARTP"),
      versionNumber: Number(item.versionNumber ?? 0),
      documentStatus: String(item.documentStatus ?? ""),
      deliveryId: String(item.deliveryId ?? ""),
      mySignatureStatus: String(item.mySignatureStatus ?? ""),
      assigneeRole: String(item.assigneeRole ?? "worker"),
      title: String(item.title ?? "ARTP"),
    };
  });
}

export function artpDocumentStatusLabel(status: string): string {
  switch (status) {
    case "vigente":
      return "Vigente";
    case "en_revision":
      return "Pendiente de firmas";
    case "borrador":
      return "Borrador";
    case "archivado":
      return "Archivado";
    default:
      return status;
  }
}

export async function fetchMyArtpExecutions(orgId: string): Promise<ArtpExecutionSummary[]> {
  const client = getSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from("artp_executions")
    .select(EXECUTION_COLUMNS)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    code: String(r.code),
    status: String(r.status),
    artp_version_id: String(r.artp_version_id),
    specific_location: r.specific_location ? String(r.specific_location) : null,
    starts_on: r.starts_on ? String(r.starts_on) : null,
    started_at: r.started_at ? String(r.started_at) : null,
    ended_at: r.ended_at ? String(r.ended_at) : null,
  }));
}

export async function fetchArtpVersionDetailMobile(versionId: string) {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client.rpc("get_artp_version_detail", {
    p_version_id: versionId,
  });
  if (error) return null;
  return data;
}

export async function registerArtpAckMobile(ackId: string, signaturePath: string) {
  const client = getSupabase();
  if (!client) return { ok: false as const, message: "Sin conexión" };
  const { error } = await client.rpc("register_artp_acknowledgement", {
    p_ack_id: ackId,
    p_signature_path: signaturePath,
  });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const };
}
