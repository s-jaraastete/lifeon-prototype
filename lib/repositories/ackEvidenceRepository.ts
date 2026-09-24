import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";

export const ACK_EVIDENCE_BUCKET = "acknowledgement-evidence";

export async function createSignatureSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured() || !storagePath.trim()) {
    return null;
  }

  const { data, error } = await client.storage
    .from(ACK_EVIDENCE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    logPersistenceError("ackEvidence.signedUrl", error);
    return null;
  }

  return data?.signedUrl ?? null;
}
