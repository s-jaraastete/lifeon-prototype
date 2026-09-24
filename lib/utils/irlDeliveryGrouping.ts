import { scopedIperMatrixId } from "@/lib/utils/iperMatrixPersistence";
import type { DocumentDeliveryDetail } from "@/lib/repositories/documentDeliveriesRepository";

export function irlMatrixStorageKey(matrixOrSourceId: string, orgId: string): string {
  return scopedIperMatrixId(matrixOrSourceId, orgId);
}

export function deliveryRank(d: DocumentDeliveryDetail): number {
  if (d.status === "firmado") return 300;
  if (d.status === "pendiente_firma") return 200;
  if (d.status === "pendiente_revision") return 100;
  return 0;
}

export function pickPreferredIrlDelivery(
  current: DocumentDeliveryDetail | undefined,
  next: DocumentDeliveryDetail
): DocumentDeliveryDetail {
  if (!current) return next;
  const rankA = deliveryRank(current);
  const rankB = deliveryRank(next);
  if (rankB > rankA) return next;
  if (rankB < rankA) return current;
  return next.assigned_at > current.assigned_at ? next : current;
}

/** Una entrega IRL por matriz lógica (ids con y sin prefijo de org). */
export function indexIrlDeliveriesByMatrix(
  deliveries: DocumentDeliveryDetail[],
  orgId: string
): Map<string, DocumentDeliveryDetail> {
  const map = new Map<string, DocumentDeliveryDetail>();
  for (const row of deliveries) {
    if (row.source_type !== "irl") continue;
    const key = irlMatrixStorageKey(row.source_id, orgId);
    map.set(key, pickPreferredIrlDelivery(map.get(key), row));
  }
  return map;
}

export function matrixIdsMatch(a: string, b: string, orgId: string): boolean {
  return irlMatrixStorageKey(a, orgId) === irlMatrixStorageKey(b, orgId);
}
