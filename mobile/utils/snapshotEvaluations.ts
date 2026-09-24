import type { IrlEvaluation } from "@/types/models";

export function evaluationFromSnapshotRow(raw: Record<string, unknown>): IrlEvaluation {
  return {
    id: raw.id != null ? String(raw.id) : undefined,
    task: raw.task != null ? String(raw.task) : undefined,
    process: raw.process != null ? String(raw.process) : undefined,
    hazard: raw.hazard != null ? String(raw.hazard) : undefined,
    riskEvent: raw.riskEvent != null ? String(raw.riskEvent) : undefined,
    initialLevel: raw.initialLevel != null ? String(raw.initialLevel) : undefined,
    controls: raw.controls != null ? String(raw.controls) : undefined,
    cargo: raw.cargo != null ? String(raw.cargo) : undefined,
  };
}
