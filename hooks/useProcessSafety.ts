"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useArtpOrgId } from "@/hooks/useArtp";
import {
  deletePsActivity,
  fetchPsActivities,
  fetchPsProgressLog,
  seedPsBaseTemplate,
  updatePsActivityProgress,
  upsertPsActivity,
} from "@/lib/repositories/processSafetyRepository";

export const psQueryKeys = {
  all: (orgId: string) => ["process-safety", orgId] as const,
  activities: (orgId: string) => ["process-safety", orgId, "activities"] as const,
  log: (orgId: string) => ["process-safety", orgId, "log"] as const,
};

export function useProcessSafetyData() {
  const orgId = useArtpOrgId();
  const activities = useQuery({
    queryKey: psQueryKeys.activities(orgId),
    queryFn: () => fetchPsActivities(orgId),
  });
  const log = useQuery({
    queryKey: psQueryKeys.log(orgId),
    queryFn: () => fetchPsProgressLog(orgId),
  });
  return { orgId, activities, log };
}

export function useProcessSafetyMutations() {
  const orgId = useArtpOrgId();
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: psQueryKeys.all(orgId) });
  };

  return {
    orgId,
    invalidate,
    seedPsBaseTemplate,
    upsertPsActivity,
    updatePsActivityProgress,
    deletePsActivity,
  };
}
