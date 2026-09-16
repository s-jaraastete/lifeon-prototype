import "server-only";

import {
  DEFAULT_ORGANIZATION_PREFERENCES,
  type OrganizationPreferences,
} from "@/types/preferences";
import { fetchPreferencesFromSupabase } from "@/lib/services/supabaseService";

export async function loadOrganizationPreferencesForSession(
  orgId: string
): Promise<OrganizationPreferences> {
  const remote = await fetchPreferencesFromSupabase(orgId);
  if (remote) {
    return { ...DEFAULT_ORGANIZATION_PREFERENCES, ...remote };
  }
  return { ...DEFAULT_ORGANIZATION_PREFERENCES };
}
