import type {
  ArtpChangeAnswer,
  ArtpCheckAnswer,
  ArtpStep,
  ArtpVersionDetail,
  ArtpWorkerSignature,
  ArtpWorkContext,
} from "@/types/artp";
import { buildInitialChangeAnswers } from "@/lib/artp/changeManagementQuestions";
import { parseStepWithEvents } from "@/lib/artp/stepTreeMapper";

export function artpIperTaskOptionKey(matrixId: string, taskName: string): string {
  return `${matrixId}::${taskName}`;
}

function applyPlanningControlAnswers(
  steps: ArtpStep[],
  controlAnswers: Record<string, ArtpCheckAnswer> | undefined
): ArtpStep[] {
  const answers = controlAnswers ?? {};
  return steps.map((s) => {
    const parsed = parseStepWithEvents(s);
    return {
      ...parsed,
      events: (parsed.events ?? []).map((ev) => ({
        ...ev,
        controls: ev.controls.map((c) => ({
          ...c,
          verificationQuestion: c.verificationQuestion ?? "",
          verificationAnswer: c.verificationAnswer ?? answers[c.id] ?? null,
        })),
      })),
    };
  });
}

const EMPTY_WORK_CONTEXT: ArtpWorkContext = {
  workDate: "",
  startTime: "",
  endTime: "",
  specificLocation: "",
  workArea: "",
  supervisorName: "",
  supervisorSignatureDataUrl: null,
};

export function mergeChangeAnswersFromPlanning(
  stored: ArtpChangeAnswer[] | undefined
): ArtpChangeAnswer[] {
  const base = buildInitialChangeAnswers();
  if (!stored?.length) return base;
  const byId = new Map(stored.map((r) => [r.questionId, r]));
  return base.map((row) => {
    const saved = byId.get(row.questionId);
    return saved ? { ...row, ...saved, question: row.question } : row;
  });
}

export function loadWizardStateFromDetail(detail: ArtpVersionDetail): {
  taskName: string;
  iperMatrixId?: string;
  workContext: ArtpWorkContext;
  changeAnswers: ArtpChangeAnswer[];
  steps: ArtpStep[];
  workers: ArtpWorkerSignature[];
  versionId: string;
  documentId: string;
} {
  const planning = detail.planning;
  const workContext: ArtpWorkContext = planning?.workContext
    ? { ...EMPTY_WORK_CONTEXT, ...planning.workContext }
    : { ...EMPTY_WORK_CONTEXT };

  const steps = applyPlanningControlAnswers(detail.steps, planning?.controlAnswers);

  return {
    taskName: detail.version.taskName || detail.document.name,
    iperMatrixId: planning?.iperMatrixId,
    workContext,
    changeAnswers: mergeChangeAnswersFromPlanning(planning?.changeAnswers),
    steps,
    workers: planning?.workers ?? [],
    versionId: detail.version.id,
    documentId: detail.document.id,
  };
}
