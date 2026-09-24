import type { SupabaseClient } from "@supabase/supabase-js";

export const ORG_LOGOS_BUCKET = "organization-logos";

export function resolvePublicStorageUrl(
  client: SupabaseClient,
  bucket: string,
  pathOrUrl: string | null | undefined
): string | null {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const { data } = client.storage.from(bucket).getPublicUrl(pathOrUrl);
  return data.publicUrl;
}

export function resolveOrganizationLogoUrl(
  client: SupabaseClient,
  organizationId: string,
  logoUrl: string | null | undefined,
  logoPath: string | null | undefined
): string | null {
  if (logoUrl && logoUrl.startsWith("http")) return logoUrl;
  if (logoPath && logoPath.startsWith("http")) return logoPath;
  const fromPath = resolvePublicStorageUrl(client, ORG_LOGOS_BUCKET, logoPath);
  if (fromPath) return fromPath;
  return (
    resolvePublicStorageUrl(client, ORG_LOGOS_BUCKET, `${organizationId}/logo.png`) ??
    resolvePublicStorageUrl(client, ORG_LOGOS_BUCKET, `${organizationId}/logo.jpg`)
  );
}
