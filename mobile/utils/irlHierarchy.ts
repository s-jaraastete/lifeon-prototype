import type { IrlEvaluation } from "@/types/models";

export type IrlRiskNode = {
  id: string;
  riskEvent: string;
  initialLevel?: string;
  controls: string[];
};

export type IrlHazardNode = {
  id: string;
  hazard: string;
  risks: IrlRiskNode[];
};

export type IrlTaskNode = {
  id: string;
  task: string;
  process?: string;
  hazards: IrlHazardNode[];
};

/** Separa medidas de control en ítems (viñetas, saltos de línea, numeración). */
export function splitControlMeasures(text?: string | null): string[] {
  if (!text?.trim()) return ["—"];
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[•●▪]/g, "\n")
    .replace(/\n\s*-\s+/g, "\n")
    .replace(/\n\s*\*\s+/g, "\n");

  const parts = normalized
    .split(/\n+/)
    .flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed) return [];
      const numbered = trimmed.split(/(?=\d+[\.)]\s+)/).map((p) => p.replace(/^\d+[\.)]\s*/, "").trim());
      return numbered.filter(Boolean);
    })
    .map((p) => p.replace(/^[-–—]\s*/, "").trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [text.trim()];
  }
  return [...new Set(parts)];
}

function slug(s: string, prefix: string, index: number): string {
  return `${prefix}-${index}-${s.slice(0, 24).replace(/\s+/g, "-")}`;
}

export function buildIrlHierarchy(evaluations: IrlEvaluation[]): IrlTaskNode[] {
  const tasks: IrlTaskNode[] = [];
  const taskIndex = new Map<string, IrlTaskNode>();

  evaluations.forEach((ev, rowIdx) => {
    const taskLabel = ev.task?.trim() || "Actividad sin nombre";
    let taskNode = taskIndex.get(taskLabel);
    if (!taskNode) {
      taskNode = {
        id: slug(taskLabel, "task", tasks.length),
        task: taskLabel,
        process: ev.process?.trim() || undefined,
        hazards: [],
      };
      taskIndex.set(taskLabel, taskNode);
      tasks.push(taskNode);
    } else if (!taskNode.process && ev.process?.trim()) {
      taskNode.process = ev.process.trim();
    }

    const hazardLabel = ev.hazard?.trim() || "Peligro no especificado";
    let hazardNode = taskNode.hazards.find((h) => h.hazard === hazardLabel);
    if (!hazardNode) {
      hazardNode = {
        id: slug(hazardLabel, "haz", taskNode.hazards.length),
        hazard: hazardLabel,
        risks: [],
      };
      taskNode.hazards.push(hazardNode);
    }

    const riskLabel = ev.riskEvent?.trim() || "Riesgo no especificado";
    let riskNode = hazardNode.risks.find((r) => r.riskEvent === riskLabel);
    const measures = splitControlMeasures(ev.controls);
    if (!riskNode) {
      riskNode = {
        id: slug(riskLabel, "risk", hazardNode.risks.length),
        riskEvent: riskLabel,
        initialLevel: ev.initialLevel,
        controls: measures,
      };
      hazardNode.risks.push(riskNode);
    } else {
      riskNode.controls = [...new Set([...riskNode.controls, ...measures])];
      if (!riskNode.initialLevel && ev.initialLevel) {
        riskNode.initialLevel = ev.initialLevel;
      }
    }

    void rowIdx;
  });

  return tasks;
}
