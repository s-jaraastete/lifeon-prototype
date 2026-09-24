import { buildIrlDocumentCode } from "@/lib/irl/irlDocumentCopy";
import { filterEvaluationsForCargo } from "@/lib/irl/filterEvaluationsForCargo";

type MatrixLike = {
  id: string;
  code?: string;
  title?: string;
  name?: string;
  responsible?: string;
  workCenterName?: string;
  workCenter?: string;
  evaluations?: unknown[];
  hazards?: unknown[];
};

export function buildIrlPreviewSnapshot(params: {
  matrix: MatrixLike;
  cargoName: string;
  organizationName: string;
  organizationLogoUrl?: string | null;
  assigneeFullName?: string;
  assigneeIdentificationNumber?: string | null;
}): Record<string, unknown> {
  const matrixCode = params.matrix.code?.trim() || "IPER";
  const cargo = params.cargoName.trim() || "Cargo";
  const evals = filterEvaluationsForCargo(
    (params.matrix.evaluations ||
      params.matrix.hazards ||
      []) as Parameters<typeof filterEvaluationsForCargo>[0],
    cargo
  );

  return {
    kind: "irl",
    matrixId: params.matrix.id,
    matrixCode,
    matrixTitle: params.matrix.title || params.matrix.name || "Matriz IPER",
    workCenterName:
      params.matrix.workCenterName || params.matrix.workCenter || "—",
    cargoName: cargo,
    responsible: params.matrix.responsible || "—",
    organizationName: params.organizationName,
    organizationLogoUrl: params.organizationLogoUrl ?? null,
    documentCode: buildIrlDocumentCode(matrixCode, cargo),
    issuedAt: new Date().toISOString(),
    assigneeFullName: params.assigneeFullName ?? null,
    assigneeIdentificationNumber: params.assigneeIdentificationNumber ?? null,
    evaluations: evals,
  };
}
