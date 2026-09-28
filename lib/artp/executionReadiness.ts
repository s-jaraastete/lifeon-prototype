import type {
  ArtpCheckAnswer,
  ArtpExecutionStatus,
  ArtpStepControl,
} from "@/types/artp";

export interface ExecutionParticipantState {
  memberId: string;
  fitToWork: boolean | null;
  alertOk: boolean | null;
  acknowledgementConfirmed: boolean;
}

export interface ExecutionCheckState {
  controlId: string;
  isCritical: boolean;
  answer: ArtpCheckAnswer | null;
  note?: string;
}

export interface ExecutionChangeState {
  category: "personas" | "entorno" | "herramientas";
  implementationVerified: boolean;
}

export interface ExecutionReadinessInput {
  status: ArtpExecutionStatus;
  participantCount: number;
  participants: ExecutionParticipantState[];
  environmentOk: boolean | null;
  peopleAsPlanned: boolean | null;
  toolsAsPlanned: boolean | null;
  changes: ExecutionChangeState[];
  checks: ExecutionCheckState[];
  warnings: string[];
}

export interface ReadinessResult {
  readyToStart: boolean;
  readyToComplete: boolean;
  blockReasons: string[];
  warnings: string[];
}

export function evaluateExecutionReadiness(input: ExecutionReadinessInput): ReadinessResult {
  const blockReasons: string[] = [];
  const warnings = [...input.warnings];

  if (input.status === "pendiente") {
    if (input.participantCount < 1) {
      blockReasons.push("Se requiere al menos un participante.");
    }
    for (const p of input.participants) {
      if (p.fitToWork !== true) {
        blockReasons.push("Todos los participantes deben declarar condición para ejecutar (Sí).");
        break;
      }
      if (p.alertOk !== true) {
        blockReasons.push("Todos los participantes deben declarar estado de alerta (Sí).");
        break;
      }
      if (!p.acknowledgementConfirmed) {
        blockReasons.push("Falta toma de conocimiento confirmada de uno o más participantes.");
        break;
      }
    }
    if (input.environmentOk !== true) {
      const envChange = input.changes.some(
        (c) => c.category === "entorno" && c.implementationVerified
      );
      if (!envChange) {
        blockReasons.push("Las condiciones del entorno no están verificadas.");
      }
    }
    if (input.peopleAsPlanned === false) {
      const ok = input.changes.some(
        (c) => c.category === "personas" && c.implementationVerified
      );
      if (!ok) blockReasons.push("Gestión del cambio de personas pendiente.");
    }
    if (input.toolsAsPlanned === false) {
      const ok = input.changes.some(
        (c) => c.category === "herramientas" && c.implementationVerified
      );
      if (!ok) blockReasons.push("Gestión del cambio de herramientas pendiente.");
    }
    for (const chk of input.checks) {
      if (!chk.isCritical) {
        if (chk.answer === "no") {
          warnings.push(`Control no crítico con respuesta No: ${chk.controlId}`);
        }
        continue;
      }
      if (chk.answer !== "si") {
        blockReasons.push("Hay controles críticos sin verificar (respuesta Sí requerida).");
        break;
      }
    }
  }

  const readyToStart = input.status === "pendiente" && blockReasons.length === 0;
  const readyToComplete =
    (input.status === "en_ejecucion" || input.status === "detenida") &&
    input.checks.filter((c) => c.isCritical).every((c) => c.answer === "si");

  return {
    readyToStart,
    readyToComplete,
    blockReasons,
    warnings,
  };
}

export function flattenControlsFromSteps(
  steps: { hazards: { risks: { controls: ArtpStepControl[] }[] }[] }[]
): ArtpStepControl[] {
  const out: ArtpStepControl[] = [];
  for (const step of steps) {
    for (const h of step.hazards) {
      for (const r of h.risks) {
        out.push(...r.controls);
      }
    }
  }
  return out;
}
