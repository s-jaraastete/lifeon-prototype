import type { IrlMatrixEntry, MemberContext } from "@/types/models";
import { buildIrlDocumentCode } from "@/utils/irlDocumentCopy";

export function pickPrimaryIrlEntry(entries: IrlMatrixEntry[]): IrlMatrixEntry | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => {
    const sk = (a.sortKey ?? 99) - (b.sortKey ?? 99);
    if (sk !== 0) return sk;
    return (a.matrixCode ?? "").localeCompare(b.matrixCode ?? "", "es");
  });
  return sorted[0] ?? null;
}

export function shouldShowIrlPicker(entries: IrlMatrixEntry[]): boolean {
  if (entries.length <= 1) return false;
  const primaries = entries.filter((e) => (e.sortKey ?? 99) === 0);
  return primaries.length > 1;
}

export function buildIrlSnapshotFromEntry(
  entry: IrlMatrixEntry,
  member?: MemberContext | null,
  organizationLogoUrl?: string | null
): Record<string, unknown> {
  return {
    kind: "irl",
    matrixId: entry.matrixId,
    matrixCode: entry.matrixCode,
    matrixTitle: entry.matrixTitle,
    workCenterName: entry.workCenterName,
    cargoName: entry.cargoName,
    organizationName: entry.organizationName,
    organizationLogoUrl: organizationLogoUrl ?? null,
    documentCode: buildIrlDocumentCode(entry.matrixCode, entry.cargoName),
    issuedAt: new Date().toISOString(),
    assigneeFullName: member?.displayName?.trim() || null,
    evaluations: entry.evaluations,
  };
}
