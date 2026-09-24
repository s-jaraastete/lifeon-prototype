import { getSupabase } from "@/services/supabase";

export const AVATARS_BUCKET = "avatars";
export const ORG_LOGOS_BUCKET = "organization-logos";

export function resolvePublicMediaUrl(
  bucket: string,
  pathOrUrl: string | null | undefined
): string | null {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const { data } = getSupabase().storage.from(bucket).getPublicUrl(pathOrUrl);
  return data.publicUrl;
}
