/** Demo / seed flags for LifeOn dashboard (client-readable env). */

export function isSergioAutoSeedEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LIFEON_ALLOW_SERGIO_AUTO_SEED === "true";
}

export function resolveProductOrgId(orgId: string | undefined | null): string | null {
  const trimmed = orgId?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function isDemoOrganizationId(orgId: string | null | undefined): boolean {
  return orgId === "org_demo";
}
