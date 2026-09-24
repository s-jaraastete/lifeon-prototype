import { getSupabase, ACK_EVIDENCE_BUCKET } from "@/services/supabase";
import type { DocumentDelivery } from "@/types/models";

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleaned = base64.replace(/^data:image\/\w+;base64,/, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function fetchMyDeliveries(): Promise<DocumentDelivery[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("document_deliveries")
    .select("*")
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as DocumentDelivery[];
}

export async function fetchDeliveryById(id: string): Promise<DocumentDelivery | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("document_deliveries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data as DocumentDelivery | null;
}

export async function markDocumentOpened(deliveryId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("mark_document_opened", {
    p_delivery_id: deliveryId,
  });
  if (error) throw new Error(error.message);
}

export async function confirmDocumentReview(deliveryId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("confirm_document_review", {
    p_delivery_id: deliveryId,
  });
  if (error) throw new Error(error.message);
}

export async function uploadSignatureAndRegister(
  delivery: DocumentDelivery,
  authUserId: string,
  base64Png: string
): Promise<void> {
  const supabase = getSupabase();
  const path = `${delivery.organization_id}/${authUserId}/${delivery.id}.png`;
  const arrayBuffer = base64ToArrayBuffer(base64Png);

  const { error: uploadError } = await supabase.storage
    .from(ACK_EVIDENCE_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: rpcError } = await supabase.rpc("register_acknowledgement", {
    p_delivery_id: delivery.id,
    p_signature_path: path,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }
}

export function isPending(status: DocumentDelivery["status"]): boolean {
  return status === "pendiente_revision" || status === "pendiente_firma";
}

export function deliveryStatusLabel(status: DocumentDelivery["status"]): string {
  switch (status) {
    case "pendiente_revision":
      return "Pendiente de revisión";
    case "pendiente_firma":
      return "Pendiente de firma";
    case "firmado":
      return "Firmado";
    case "anulado":
      return "Anulado";
    default:
      return status;
  }
}
