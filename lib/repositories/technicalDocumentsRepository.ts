import { getSupabaseClient } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import type { TechnicalDocument } from "@/types/technicalDocs";

export async function fetchTechnicalDocuments(orgId: string): Promise<TechnicalDocument[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("technical_documents")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });
  if (error) {
    logPersistenceError("technicalDocs.fetch", error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    organizationId: row.organization_id,
    documentType: row.document_type,
    name: row.name,
    status: row.status,
    content: row.content || {},
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function upsertTechnicalDocument(
  orgId: string,
  doc: TechnicalDocument,
  createdBy?: string | null
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from("technical_documents").upsert({
    id: doc.id,
    organization_id: orgId,
    document_type: doc.documentType,
    name: doc.name,
    status: doc.status,
    content: doc.content,
    created_by: createdBy ?? doc.createdBy ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    logPersistenceError("technicalDocs.upsert", error);
    return false;
  }
  return true;
}

export async function deleteTechnicalDocument(orgId: string, docId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client
    .from("technical_documents")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", docId);
  if (error) {
    logPersistenceError("technicalDocs.delete", error);
    return false;
  }
  return true;
}
