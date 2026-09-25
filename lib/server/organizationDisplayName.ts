import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  organizationNameFromPreferencesJson,
  resolveOrganizationDisplayName,
} from "@/lib/organization/displayName";

function preferencesRowId(orgId: string): string {
  return orgId === "org_demo" ? "default_org" : orgId;
}

export async function fetchOrganizationDisplayName(
  client: SupabaseClient,
  organizationId: string
): Promise<string> {
  const { data: orgRow } = await client
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();

  const { data: prefRow } = await client
    .from("organization_preferences")
    .select("preferences")
    .eq("id", preferencesRowId(organizationId))
    .maybeSingle();

  const fromPrefs = organizationNameFromPreferencesJson(prefRow?.preferences);
  return resolveOrganizationDisplayName(fromPrefs, orgRow?.name);
}

export async function syncOrganizationTableName(
  client: SupabaseClient,
  organizationId: string,
  displayName: string
): Promise<void> {
  const trimmed = displayName.trim();
  if (!trimmed) return;
  await client.from("organizations").update({ name: trimmed }).eq("id", organizationId);
}
