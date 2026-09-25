import { getSupabaseClient } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import type { TechnicalDocument } from "@/types/technicalDocs";

const TECH_DOC_LIST_COLUMNS =
  "id, organization_id, document_type, name, status, created_by, created_at, updated_at";

export async function fetchTechnicalDocuments(orgId: string): Promise<TechnicalDocument[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("technical_documents")
    .select(TECH_DOC_LIST_COLUMNS)
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });
  if (error) {
    logPersistenceError("technicalDocs.fetch", error);
    return [];
  }
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    organizationId: row.organization_id as string,
    documentType: row.document_type as TechnicalDocument["documentType"],
    name: row.name as string,
    status: row.status as TechnicalDocument["status"],
    content: {},
    createdBy: (row.created_by as string | null) ?? undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  }));
}

export async function fetchTechnicalDocumentById(
  orgId: string,
  docId: string
): Promise<TechnicalDocument | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("technical_documents")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", docId)
    .maybeSingle();
  if (error) {
    logPersistenceError("technicalDocs.fetchOne", error);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    organizationId: data.organization_id,
    documentType: data.document_type,
    name: data.name,
    status: data.status,
    content: data.content || {},
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
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
