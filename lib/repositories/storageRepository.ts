import { getSupabaseClient } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import { mustUseSupabasePersistence } from "@/lib/env/runtime";

export const STORAGE_BUCKETS = {
  avatars: "avatars",
  organizationLogos: "organization-logos",
  programEvidence: "program-evidence",
  technicalDocuments: "technical-documents",
} as const;

export async function uploadToStorage(
  bucket: string,
  filePath: string,
  file: Blob | File
): Promise<{ publicUrl: string | null; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      publicUrl: null,
      error: mustUseSupabasePersistence()
        ? "Supabase no está configurado."
        : undefined,
    };
  }

  try {
    const { error: uploadError } = await client.storage.from(bucket).upload(filePath, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });
    if (uploadError) {
      logPersistenceError(`storage.upload.${bucket}`, uploadError);
      return { publicUrl: null, error: uploadError.message };
    }
    const { data } = client.storage.from(bucket).getPublicUrl(filePath);
    return { publicUrl: data?.publicUrl ?? null };
  } catch (e) {
    logPersistenceError(`storage.upload.${bucket}`, e);
    return { publicUrl: null, error: "Error al subir archivo." };
  }
}

export async function removeStoragePaths(bucket: string, paths: string[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || paths.length === 0) return;
  try {
    await client.storage.from(bucket).remove(paths);
  } catch (e) {
    logPersistenceError(`storage.remove.${bucket}`, e);
  }
}
