import type { DocumentDelivery } from "@/types/models";

export function normalizeDeliverySnapshot(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function isIrlDelivery(delivery: DocumentDelivery): boolean {
  if (delivery.source_type === "irl") return true;
  const snap = normalizeDeliverySnapshot(delivery.content_snapshot);
  return snap.kind === "irl";
}
