import type { QueryClient } from "@tanstack/react-query";
import { getScopedStorageKey } from "@/lib/auth/authService";
import { ORG_STRUCTURE_STORAGE_KEY } from "@/hooks/useOrgStructure";
import { PREVENTIVE_PROGRAM_STORAGE_KEY } from "@/hooks/usePreventiveProgram";
import { PLATFORM_USERS_STORAGE_KEY } from "@/hooks/useUsers";
import { TECHNICAL_DOCS_STORAGE_KEY } from "@/hooks/useTechnicalDocs";
import { PREFERENCES_STORAGE_KEY } from "@/providers/LifeOnPreferencesProvider";

const DOMAIN_PREFIXES = [
  "lifeon_iper_matrices_",
  "lifeon_iper_draft_",
  "lifeon_active_workplace",
  "lifeon_user_photo_",
];

export function clearOrgScopedLocalStorage(orgId?: string): void {
  if (typeof window === "undefined") return;
  const keys = [
    getScopedStorageKey(PREFERENCES_STORAGE_KEY, orgId),
    getScopedStorageKey(ORG_STRUCTURE_STORAGE_KEY, orgId),
    getScopedStorageKey(PREVENTIVE_PROGRAM_STORAGE_KEY, orgId),
    getScopedStorageKey(PLATFORM_USERS_STORAGE_KEY, orgId),
    getScopedStorageKey(TECHNICAL_DOCS_STORAGE_KEY, orgId),
    orgId ? `lifeon_iper_matrices_${orgId}` : "lifeon_iper_matrices_org_demo",
    getScopedStorageKey("lifeon_active_workplace", orgId),
  ];
  keys.forEach((k) => window.localStorage.removeItem(k));

  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (orgId && key.includes(orgId)) {
      window.localStorage.removeItem(key);
      continue;
    }
    if (DOMAIN_PREFIXES.some((p) => key.startsWith(p))) {
      window.localStorage.removeItem(key);
    }
  }
}

export function clearDashboardQueryCache(queryClient: QueryClient): void {
  queryClient.clear();
}
