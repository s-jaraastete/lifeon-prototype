import { getSupabaseClient } from "@/lib/supabaseClient";
import { OrganizationPreferences } from "@/types/preferences";
import { logPersistenceError } from "@/lib/supabase/persistenceError";

export interface OrganizationRow {
  id: string;
  name: string;
  industry: string | null;
  size: string | null;
  logo_url: string | null;
  logo_path: string | null;
}

function prefsRowId(orgId: string): string {
  return orgId === "org_demo" ? "default_org" : orgId;
}

export async function fetchOrganization(orgId: string): Promise<OrganizationRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("organizations")
    .select("id, name, industry, size, logo_url, logo_path")
    .eq("id", orgId)
    .maybeSingle();
  if (error) {
    logPersistenceError("organization.fetch", error);
    return null;
  }
  return data as OrganizationRow | null;
}

export async function updateOrganization(
  orgId: string,
  patch: Partial<Pick<OrganizationRow, "name" | "industry" | "size" | "logo_url" | "logo_path">>
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from("organizations").update(patch).eq("id", orgId);
  if (error) {
    logPersistenceError("organization.update", error);
    return false;
  }
  return true;
}

export async function fetchOrganizationPreferences(
  orgId: string
): Promise<OrganizationPreferences | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const targetId = prefsRowId(orgId);
  const { data, error } = await client
    .from("organization_preferences")
    .select("preferences")
    .eq("id", targetId)
    .maybeSingle();
  if (error || !data) return null;
  return data.preferences as OrganizationPreferences;
}

/** Las imágenes viven en profiles / organizations; no duplicar URLs en JSON de preferencias. */
function preferencesForCloud(prefs: OrganizationPreferences): OrganizationPreferences {
  const { profilePhoto: _p, organizationLogo: _l, ...rest } = prefs;
  return {
    ...rest,
    profilePhoto: null,
    organizationLogo: null,
  };
}

export async function saveOrganizationPreferences(
  orgId: string,
  prefs: OrganizationPreferences
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const targetId = prefsRowId(orgId);
  const { error } = await client.from("organization_preferences").upsert({
    id: targetId,
    organization_id: orgId === "org_demo" ? "org_demo" : orgId,
    preferences: preferencesForCloud(prefs),
  });
  if (error) {
    logPersistenceError("organization.preferences.save", error);
    return false;
  }
  return true;
}
