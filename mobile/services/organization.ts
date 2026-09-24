import { getSupabase } from "@/services/supabase";
import { ORG_LOGOS_BUCKET, resolvePublicMediaUrl } from "@/services/media";

export interface OrganizationBranding {
  name: string;
  logoUrl: string | null;
}

export async function fetchOrganizationBranding(
  organizationId: string
): Promise<OrganizationBranding | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("organizations")
    .select("name, logo_url, logo_path")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const logoUrl =
    data.logo_url ??
    resolvePublicMediaUrl(ORG_LOGOS_BUCKET, data.logo_path) ??
    resolvePublicMediaUrl(ORG_LOGOS_BUCKET, `${organizationId}/logo.png`) ??
    resolvePublicMediaUrl(ORG_LOGOS_BUCKET, `${organizationId}/logo.jpg`);

  return {
    name: String(data.name),
    logoUrl,
  };
}
