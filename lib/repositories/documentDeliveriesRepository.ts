import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import { iperMatrixIdCandidates } from "@/lib/utils/iperMatrixPersistence";

export type DocumentDeliveryRow = {
  id: string;
  organization_id: string;
  assignee_member_id: string;
  source_type: "irl" | "technical_document";
  source_id: string;
  cargo_name: string | null;
  title: string;
  status: string;
  assigned_at: string;
  opened_at: string | null;
  signed_at: string | null;
  content_hash: string;
  document_code?: string | null;
};

export type DocumentDeliveryDetail = DocumentDeliveryRow & {
  content_snapshot: Record<string, unknown>;
  signature_path?: string | null;
};

export async function assignDocumentDelivery(params: {
  organizationId: string;
  sourceType: "irl" | "technical_document";
  sourceId: string;
  assigneeMemberId: string;
  cargoName?: string | null;
}): Promise<{ id: string | null; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return { id: null, error: "Supabase no configurado" };
  }

  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session?.access_token) {
    return { id: null, error: "Inicia sesión para enviar documentos" };
  }

  try {
    const res = await fetch("/api/document-deliveries/assign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    });
    const json = (await res.json()) as { id?: string; error?: string; success?: boolean };
    if (!res.ok || !json.id) {
      return { id: null, error: json.error ?? "No se pudo asignar el documento" };
    }
    return { id: json.id };
  } catch (e) {
    logPersistenceError("deliveries.assign", e);
    return { id: null, error: "Error de red al asignar documento" };
  }
}

export async function fetchDeliveriesForSource(
  organizationId: string,
  sourceType: "irl" | "technical_document",
  sourceId: string
): Promise<DocumentDeliveryRow[]> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return [];
  }

  const sourceIds = iperMatrixIdCandidates(sourceId, organizationId);

  const { data, error } = await client
    .from("document_deliveries")
    .select(
      "id, organization_id, assignee_member_id, source_type, source_id, cargo_name, title, status, assigned_at, opened_at, signed_at, content_hash"
    )
    .eq("organization_id", organizationId)
    .eq("source_type", sourceType)
    .in("source_id", sourceIds)
    .order("assigned_at", { ascending: false });

  if (error) {
    logPersistenceError("deliveries.fetch", error);
    return [];
  }

  return (data ?? []) as DocumentDeliveryRow[];
}

export async function fetchDeliveriesForAssigneeMember(
  organizationId: string,
  assigneeMemberId: string
): Promise<DocumentDeliveryDetail[]> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await client
    .from("document_deliveries")
    .select(
      "id, organization_id, assignee_member_id, source_type, source_id, cargo_name, title, status, assigned_at, opened_at, signed_at, content_hash, document_code, content_snapshot, signature_path"
    )
    .eq("organization_id", organizationId)
    .eq("assignee_member_id", assigneeMemberId)
    .order("assigned_at", { ascending: false });

  if (error) {
    logPersistenceError("deliveries.fetchAssignee", error);
    return [];
  }

  return (data ?? []) as DocumentDeliveryDetail[];
}

export async function fetchSignedIrlDeliveryForMember(
  organizationId: string,
  matrixId: string,
  assigneeMemberId: string
): Promise<DocumentDeliveryDetail | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return null;
  }

  const sourceIds = iperMatrixIdCandidates(matrixId, organizationId);

  const { data, error } = await client
    .from("document_deliveries")
    .select(
      "id, organization_id, assignee_member_id, source_type, source_id, cargo_name, title, status, assigned_at, opened_at, signed_at, content_hash, document_code, content_snapshot, signature_path"
    )
    .eq("organization_id", organizationId)
    .eq("source_type", "irl")
    .in("source_id", sourceIds)
    .eq("assignee_member_id", assigneeMemberId)
    .eq("status", "firmado")
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logPersistenceError("deliveries.fetchSignedIrl", error);
    return null;
  }

  return (data as DocumentDeliveryDetail) ?? null;
}
