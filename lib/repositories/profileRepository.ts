import { getSupabaseClient } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";

export interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_path: string | null;
  personal_settings: Record<string, unknown>;
  updated_at?: string | null;
}

export async function fetchProfileByAuthId(authUserId: string): Promise<ProfileRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("profiles")
    .select("id, first_name, last_name, phone, avatar_path, personal_settings, updated_at")
    .eq("id", authUserId)
    .maybeSingle();
  if (error) {
    logPersistenceError("profile.fetch", error);
    return null;
  }
  return data as ProfileRow | null;
}

export async function upsertProfile(
  authUserId: string,
  patch: Partial<Pick<ProfileRow, "first_name" | "last_name" | "phone" | "avatar_path" | "personal_settings">>
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from("profiles").upsert({
    id: authUserId,
    ...patch,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    logPersistenceError("profile.upsert", error);
    return false;
  }
  return true;
}
