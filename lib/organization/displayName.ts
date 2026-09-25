/**
 * Nombre comercial / razón social mostrado en documentos, móvil y dashboard.
 * Las preferencias de onboarding son la fuente de verdad; organizations.name se mantiene alineado.
 */
export function resolveOrganizationDisplayName(
  ...candidates: (string | null | undefined)[]
): string {
  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (trimmed) return trimmed;
  }
  return "Empresa";
}

export function organizationNameFromPreferencesJson(
  preferences: unknown
): string | null {
  if (!preferences || typeof preferences !== "object") return null;
  const name = (preferences as { organizationName?: unknown }).organizationName;
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed || null;
}
