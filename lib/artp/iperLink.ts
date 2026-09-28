import type { IperEvaluationRow } from "@/app/dashboard/components/IperMatrixDetailView";
import type { ArtpStep, ArtpVersionDetail } from "@/types/artp";

export interface IperMatrixRowForLink {
  id: string;
  status: string;
  hazards: IperEvaluationRow[] | unknown;
}

export function buildIperRowsFromArtpDetail(
  detail: ArtpVersionDetail,
  cargoNames: string[]
): IperEvaluationRow[] {
  const cargo = cargoNames.join(", ");
  const rows: IperEvaluationRow[] = [];
  let idx = 0;
  for (const step of detail.steps) {
    for (const hazard of step.hazards) {
      for (const risk of hazard.risks) {
        const controls = risk.controls
          .map((c) => `[${c.controlType}] ${c.description}`)
          .join(" • ");
        idx += 1;
        rows.push({
          id: `artp_${detail.version.id}_${idx}`,
          process: detail.document.name,
          task: detail.version.taskName,
          hazard: hazard.name,
          riskEvent: risk.name,
          probInitial: 0,
          sevInitial: 0,
          riskInitial: 0,
          initialLevel: "Bajo",
          controls: controls || "",
          probResidual: 0,
          sevResidual: 0,
          riskResidual: 0,
          residualLevel: "Bajo",
          controlStatus: "Pendiente",
          responsible: "",
          cargo,
        });
      }
    }
  }
  return rows;
}

export function flattenArtpStepsForProposedRows(steps: ArtpStep[]): unknown[] {
  return steps.map((s) => ({
    sequence: s.sequence,
    description: s.description,
    tools: s.tools,
    hazards: s.hazards.map((h) => ({
      name: h.name,
      risks: h.risks.map((r) => ({
        name: r.name,
        controls: r.controls,
      })),
    })),
  }));
}

export function matrixAllowsDirectHazardEdit(status: string): boolean {
  return status === "Borrador";
}

export function mergeHazardsIntoMatrix(
  existing: IperEvaluationRow[],
  newRows: IperEvaluationRow[]
): IperEvaluationRow[] {
  return [...existing, ...newRows];
}
