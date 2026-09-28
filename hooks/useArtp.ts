"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { resolveProductOrgId } from "@/lib/env/demoFlags";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import {
  createArtpDocumentWithVersion,
  createArtpExecution,
  fetchArtpDocuments,
  fetchArtpExecutions,
  fetchArtpHomeCounts,
  fetchArtpVersionDetail,
  fetchEnergyTypes,
  fetchPendingIperLinks,
  publishArtpVersion,
  saveArtpStepsTree,
  cloneArtpVersion,
  upsertOrgTask,
} from "@/lib/repositories/artpRepository";

export const artpQueryKeys = {
  all: (orgId: string) => ["artp", orgId] as const,
  docs: (orgId: string) => ["artp", orgId, "docs"] as const,
  counts: (orgId: string) => ["artp", orgId, "counts"] as const,
  executions: (orgId: string) => ["artp", orgId, "executions"] as const,
  detail: (versionId: string) => ["artp", "version", versionId] as const,
  energies: (orgId: string) => ["artp", orgId, "energies"] as const,
  iperLinks: (orgId: string) => ["artp", orgId, "iper-links"] as const,
};

export function useArtpOrgId(): string {
  const { currentUser } = useLifeOnPreferences();
  return resolveProductOrgId(currentUser?.orgId) ?? "org_demo";
}

export function useArtpHomeCounts() {
  const orgId = useArtpOrgId();
  return useQuery({
    queryKey: artpQueryKeys.counts(orgId),
    queryFn: () => fetchArtpHomeCounts(orgId),
  });
}

export function useArtpDocuments() {
  const orgId = useArtpOrgId();
  return useQuery({
    queryKey: artpQueryKeys.docs(orgId),
    queryFn: () => fetchArtpDocuments(orgId),
  });
}

export function useArtpExecutions() {
  const orgId = useArtpOrgId();
  return useQuery({
    queryKey: artpQueryKeys.executions(orgId),
    queryFn: () => fetchArtpExecutions(orgId),
  });
}

export function useArtpVersionDetail(versionId: string | undefined) {
  return useQuery({
    queryKey: artpQueryKeys.detail(versionId ?? ""),
    queryFn: () => fetchArtpVersionDetail(versionId!),
    enabled: Boolean(versionId),
  });
}

export function useEnergyTypes() {
  const orgId = useArtpOrgId();
  return useQuery({
    queryKey: artpQueryKeys.energies(orgId),
    queryFn: () => fetchEnergyTypes(orgId),
  });
}

export function usePendingArtpIperLinks() {
  const orgId = useArtpOrgId();
  return useQuery({
    queryKey: artpQueryKeys.iperLinks(orgId),
    queryFn: () => fetchPendingIperLinks(orgId),
  });
}

export function useArtpMutations() {
  const orgId = useArtpOrgId();
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: artpQueryKeys.all(orgId) });
  };

  return {
    orgId,
    invalidate,
    upsertOrgTask,
    createArtpDocumentWithVersion,
    saveArtpStepsTree,
    publishArtpVersion,
    cloneArtpVersion,
    createArtpExecution,
  };
}
