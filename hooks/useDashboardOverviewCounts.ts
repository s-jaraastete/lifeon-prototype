"use client";

import { useEffect, useState } from "react";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { resolveProductOrgId } from "@/lib/env/demoFlags";
import {
  fetchDashboardOverviewCounts,
  type DashboardOverviewCounts,
} from "@/lib/dashboard/fetchDashboardOverviewCounts";

const EMPTY: DashboardOverviewCounts = {
  workCenters: 0,
  areas: 0,
  processes: 0,
  positions: 0,
  members: 0,
  preventiveTotal: 0,
  preventiveCompleted: 0,
  preventiveInProgress: 0,
  preventivePending: 0,
  compliancePercentage: 0,
};

export function useDashboardOverviewCounts() {
  const { currentUser } = useLifeOnPreferences();
  const orgId = resolveProductOrgId(currentUser?.orgId);
  const [counts, setCounts] = useState<DashboardOverviewCounts>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!orgId) {
      setCounts(EMPTY);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchDashboardOverviewCounts(orgId)
      .then((result) => {
        if (!cancelled && result) setCounts(result);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return { counts, isLoading, orgId };
}
