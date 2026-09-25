import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ACK_EVIDENCE_BUCKET } from "@/lib/repositories/ackEvidenceRepository";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

/**
 * Descarga PNG de firma: service_role si existe; si no, sesión del usuario (RLS en storage).
 */
export async function fetchAckSignaturePngBytes(
  userClient: SupabaseClient,
  storagePath: string
): Promise<Uint8Array | null> {
  const path = storagePath.trim();
  if (!path) return null;

  const admin = getSupabaseAdminClient();
  if (admin) {
    const { data: file, error } = await admin.storage.from(ACK_EVIDENCE_BUCKET).download(path);
    if (file && !error) {
      return new Uint8Array(await file.arrayBuffer());
    }
    console.error("[fetchAckSignaturePng] admin download failed:", error?.message);
  }

  const { data: file, error } = await userClient.storage.from(ACK_EVIDENCE_BUCKET).download(path);
  if (file && !error) {
    return new Uint8Array(await file.arrayBuffer());
  }

  console.error("[fetchAckSignaturePng] user download failed:", error?.message);
  return null;
}
