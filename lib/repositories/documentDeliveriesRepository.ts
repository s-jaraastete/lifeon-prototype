import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";

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

  const { data, error } = await client.rpc("assign_document", {
    p_organization_id: params.organizationId,
    p_source_type: params.sourceType,
    p_source_id: params.sourceId,
    p_assignee_member_id: params.assigneeMemberId,
    p_cargo_name: params.cargoName ?? null,
  });

  if (error) {
    logPersistenceError("deliveries.assign", error);
    return { id: null, error: error.message };
  }

  return { id: data as string };
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

  const { data, error } = await client
    .from("document_deliveries")
    .select(
      "id, organization_id, assignee_member_id, source_type, source_id, cargo_name, title, status, assigned_at, opened_at, signed_at, content_hash"
    )
    .eq("organization_id", organizationId)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .order("assigned_at", { ascending: false });

  if (error) {
    logPersistenceError("deliveries.fetch", error);
    return [];
  }

  return (data ?? []) as DocumentDeliveryRow[];
}
