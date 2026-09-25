import { getSupabase } from "@/services/supabase";
import { ORG_LOGOS_BUCKET, resolvePublicMediaUrl } from "@/services/media";
import {
  organizationNameFromPreferencesJson,
  resolveOrganizationDisplayName,
} from "@/utils/organizationDisplayName";

export interface OrganizationBranding {
  name: string;
  logoUrl: string | null;
}

export async function fetchOrganizationBranding(
  organizationId: string
): Promise<OrganizationBranding | null> {
  const supabase = getSupabase();
  const prefsRowId = organizationId === "org_demo" ? "default_org" : organizationId;

  const [{ data, error }, { data: prefRow }] = await Promise.all([
    supabase
      .from("organizations")
      .select("name, logo_url, logo_path")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("organization_preferences")
      .select("preferences")
      .eq("id", prefsRowId)
      .maybeSingle(),
  ]);

  if (error) throw new Error(error.message);
  if (!data) return null;

  const displayName = resolveOrganizationDisplayName(
    organizationNameFromPreferencesJson(prefRow?.preferences),
    data.name
  );

  const logoUrl =
    data.logo_url ??
    resolvePublicMediaUrl(ORG_LOGOS_BUCKET, data.logo_path) ??
    resolvePublicMediaUrl(ORG_LOGOS_BUCKET, `${organizationId}/logo.png`) ??
    resolvePublicMediaUrl(ORG_LOGOS_BUCKET, `${organizationId}/logo.jpg`);

  return {
    name: displayName,
    logoUrl,
  };
}
