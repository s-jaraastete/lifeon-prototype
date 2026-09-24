import { useCallback, useEffect, useState } from "react";
import { fetchOrganizationBranding, type OrganizationBranding } from "@/services/organization";

export function useOrgBranding(organizationId: string | undefined) {
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!organizationId) {
      setBranding(null);
      return;
    }
    setLoading(true);
    try {
      setBranding(await fetchOrganizationBranding(organizationId));
    } catch {
      setBranding(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { branding, loading, refresh };
}
