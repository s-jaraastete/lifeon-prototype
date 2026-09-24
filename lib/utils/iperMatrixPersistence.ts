import type { IperMatrixItem } from "@/app/dashboard/components/IperMatrixView";

/** ID de matriz con prefijo de organización, alineado con supabaseService. */
export function scopedIperMatrixId(id: string, orgId: string): string {
  const currentOrg = orgId || "org_demo";
  const trimmed = id.trim();
  if (
    trimmed.startsWith("org_") ||
    trimmed.startsWith("m-") ||
    trimmed.startsWith("MA-")
  ) {
    return trimmed.startsWith(`${currentOrg}_`) ? trimmed : `${currentOrg}_${trimmed}`;
  }
  return `${currentOrg}_${trimmed}`;
}

export function iperMatrixIdCandidates(rawId: string, orgId: string): string[] {
  const trimmed = rawId.trim();
  if (!trimmed) return [];

  const scoped = scopedIperMatrixId(trimmed, orgId);
  const out = new Set<string>([trimmed, scoped]);
  const prefix = `${orgId}_`;
  if (trimmed.startsWith(prefix)) {
    out.add(trimmed.slice(prefix.length));
  }
  if (scoped.startsWith(prefix)) {
    out.add(scoped.slice(prefix.length));
  }
  return [...out];
}

function matrixTimestamp(m: IperMatrixItem): number {
  const candidates = [
    (m as { updatedAt?: string }).updatedAt,
    (m as { updated_at?: string }).updated_at,
    (m as { lastReview?: string }).lastReview,
  ];
  for (const c of candidates) {
    if (c) {
      const t = Date.parse(c);
      if (!Number.isNaN(t)) return t;
    }
  }
  return 0;
}

/**
 * Combina listas local y remota sin perder matrices recién importadas ni sobrescribir con remoto vacío.
 */
export function mergeIperMatrixLists(
  local: IperMatrixItem[],
  remote: IperMatrixItem[],
  orgId: string
): IperMatrixItem[] {
  if (!remote.length) return local;
  if (!local.length) return remote;

  const map = new Map<string, IperMatrixItem>();

  for (const m of remote) {
    map.set(scopedIperMatrixId(m.id, orgId), m);
  }

  for (const m of local) {
    const key = scopedIperMatrixId(m.id, orgId);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, m);
      continue;
    }
    const localTs = matrixTimestamp(m);
    const remoteTs = matrixTimestamp(existing);
    if (localTs !== remoteTs) {
      map.set(key, localTs >= remoteTs ? m : existing);
    } else {
      map.set(key, m.name || m.title ? m : existing);
    }
  }

  return Array.from(map.values());
}

export function cloudPersistenceHint(configured: boolean): string {
  if (configured) {
    return "No se pudo guardar en la nube. La matriz solo quedará en este navegador hasta que se resuelva la sincronización.";
  }
  return "Supabase no está configurado en este entorno. La matriz solo se guardará en este navegador.";
}
