import type { ArtpStep, ArtpStepControl, ArtpStepEvent, ArtpStepHazard, ArtpStepRisk } from "@/types/artp";
import { scopedArtpId } from "@/types/artp";

const PLACEHOLDER_HAZARD = "—";

/** Convierte pasos con eventos (UI) a árbol hazard/risk (persistencia) */
export function stepsEventsToHazardTree(orgId: string, steps: ArtpStep[]): ArtpStep[] {
  return steps.map((step) => {
    const events = step.events ?? eventsFromLegacyHazards(step);
    const hazardId = step.hazards[0]?.id ?? scopedArtpId(orgId, `hz_${step.id}`);
    const risks: ArtpStepRisk[] = events.map((ev) => ({
      id: ev.id,
      name: ev.name,
      controls: ev.controls,
    }));
    return {
      ...step,
      energyTypeIds: step.energyTypeIds ?? [],
      events,
      hazards: [{ id: hazardId, name: PLACEHOLDER_HAZARD, risks }],
    };
  });
}

export function eventsFromLegacyHazards(step: ArtpStep): ArtpStepEvent[] {
  if (step.events?.length) return step.events;
  const events: ArtpStepEvent[] = [];
  for (const h of step.hazards ?? []) {
    for (const r of h.risks ?? []) {
      events.push({ id: r.id, name: r.name, controls: r.controls });
    }
  }
  return events;
}

export function parseStepWithEvents(step: ArtpStep): ArtpStep {
  const events = eventsFromLegacyHazards(step);
  return { ...step, events };
}

export function newStepEvent(orgId: string, prefix: string): ArtpStepEvent {
  return {
    id: scopedArtpId(orgId, `${prefix}_${Math.random().toString(36).slice(2, 9)}`),
    name: "",
    controls: [],
  };
}

export function newStepControl(orgId: string): ArtpStepControl {
  return {
    id: scopedArtpId(orgId, `ct_${Math.random().toString(36).slice(2, 9)}`),
    description: "",
    controlType: "Controles Administrativos",
    isCritical: false,
    verificationQuestion: "",
    verificationAnswer: null,
  };
}
