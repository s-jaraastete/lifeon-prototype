export type SnapshotEvaluation = {
  id?: string;
  task?: string;
  process?: string;
  hazard?: string;
  riskEvent?: string;
  initialLevel?: string;
  controls?: string;
  cargo?: string;
};

export function evaluationFromSnapshotRow(raw: Record<string, unknown>): SnapshotEvaluation {
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
