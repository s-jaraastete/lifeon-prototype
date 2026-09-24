import { getSupabase } from "@/services/supabase";
import { AVATARS_BUCKET, resolvePublicMediaUrl } from "@/services/media";

export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export async function fetchUserProfile(authUserId: string): Promise<UserProfile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone, avatar_path")
    .eq("id", authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: String(data.id),
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    avatarUrl: resolvePublicMediaUrl(AVATARS_BUCKET, data.avatar_path),
  };
}

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

export async function uploadUserAvatar(
  authUserId: string,
  localUri: string,
  mimeType: string
): Promise<string> {
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const storagePath = `${authUserId}/avatar.${ext}`;
  const body = await uriToArrayBuffer(localUri);
  const supabase = getSupabase();

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(storagePath, body, { upsert: true, contentType: mimeType });

  if (uploadError) throw new Error(uploadError.message);

  const publicUrl = resolvePublicMediaUrl(AVATARS_BUCKET, storagePath);
  if (!publicUrl) throw new Error("No se pudo obtener la URL de la foto");

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: authUserId,
    avatar_path: publicUrl,
    updated_at: new Date().toISOString(),
  });

  if (profileError) throw new Error(profileError.message);
  return publicUrl;
}

export async function removeUserAvatar(authUserId: string): Promise<void> {
  const supabase = getSupabase();
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    await supabase.storage.from(AVATARS_BUCKET).remove([`${authUserId}/avatar.${ext}`]);
  }
  const { error } = await supabase.from("profiles").upsert({
    id: authUserId,
    avatar_path: null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }
  const { error } = await getSupabase().auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
