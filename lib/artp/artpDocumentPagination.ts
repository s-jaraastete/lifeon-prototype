import type { ArtpChangeAnswer, ArtpStep, ArtpWorkerSignature } from "@/types/artp";
import { eventsFromLegacyHazards } from "@/lib/artp/stepTreeMapper";
import { ARTP_CHANGE_SECTIONS, ARTP_CHANGE_SECTION_LABELS } from "@/lib/artp/changeManagementQuestions";

/** Capacidad conservadora del cuerpo (hoja carta 279 mm menos márgenes y pie) */
export const ARTP_SHEET_BODY_CAPACITY = 74;

/** Margen extra solo en hoja 1 para aprovechar espacio tras antecedentes (sección II). */
const FIRST_PAGE_EXTRA_CAPACITY = 14;

export type StepTableRow = {
  stepSequence: number;
  stepDescription: string;
  tools: string;
  event: string;
  control: string;
  verification: string;
  verificationAnswer: string | null;
};

export type ArtpDocBlock =
  | {
      kind: "fullHeader";
      id: string;
      organizationName: string;
      organizationLogoUrl?: string | null;
      taskName: string;
      versionNumber: number;
      status: string;
      docCode: string;
      emissionDate: string;
    }
  | {
      kind: "sectionTitle";
      id: string;
      roman: string;
      title: string;
    }
  | {
      kind: "antecedentes";
      id: string;
      organizationName: string;
      taskName: string;
      workDate?: string;
      startTime?: string;
      endTime?: string;
      specificLocation?: string;
      workArea?: string;
      supervisorName?: string;
      supervisorSignatureDataUrl?: string | null;
    }
  | { kind: "changeSubTitle"; id: string; sectionIndex: number; label: string }
  | {
      kind: "changeRow";
      id: string;
      row: ArtpChangeAnswer;
      /** Primera fila de la subsección: la altura ya incluye thead. */
      subsectionTableHeadInHeight?: boolean;
    }
  | { kind: "stepTableHead"; id: string }
  | { kind: "stepRow"; id: string; row: StepTableRow }
  | { kind: "workersTableHead"; id: string }
  | { kind: "workerRow"; id: string; worker?: ArtpWorkerSignature; emptySlot?: number };

type InternalBlock = ArtpDocBlock & {
  heightUnits: number;
  orphanMinFollow?: number;
};

const U = {
  fullHeader: 28,
  sectionTitle: 5,
  antecedentes: 24,
  changeSubTitle: 5,
  changeTableHead: 4,
  changeRow: 3.2,
  changeRowDetail: 9.5,
  stepTableHead: 4,
  stepRow: 3,
  stepRowTall: 4.5,
  workersTableHead: 3.5,
  workerRow: 4,
  workerRowCompact: 3,
  workerRowDense: 2.4,
} as const;

function workerRowHeightUnits(workerCount: number): number {
  if (workerCount >= 8) return U.workerRowDense;
  if (workerCount >= 4) return U.workerRowCompact;
  return U.workerRow;
}

function changeRowHeight(row: ArtpChangeAnswer): number {
  const base = row.answer === false ? U.changeRowDetail : U.changeRow;
  const longQuestion = (row.question?.length ?? 0) > 120;
  return base + (longQuestion ? 1.5 : 0);
}

function stepRowHeight(row: StepTableRow): number {
  const textLen =
    row.stepDescription.length +
    row.event.length +
    row.control.length +
    row.verification.length;
  return textLen > 180 ? U.stepRowTall : U.stepRow;
}

export function buildStepTableRows(steps: ArtpStep[]): StepTableRow[] {
  const rows: StepTableRow[] = [];
  for (const step of steps) {
    const events = eventsFromLegacyHazards(step);
    const tools = step.tools.length ? step.tools.join(", ") : "—";
    if (events.length === 0) {
      rows.push({
        stepSequence: step.sequence,
        stepDescription: step.description,
        tools,
        event: "—",
        control: "—",
        verification: "—",
        verificationAnswer: null,
      });
      continue;
    }
    for (const ev of events) {
      if (ev.controls.length === 0) {
        rows.push({
          stepSequence: step.sequence,
          stepDescription: step.description,
          tools,
          event: ev.name || "—",
          control: "—",
          verification: "—",
          verificationAnswer: null,
        });
        continue;
      }
      for (const c of ev.controls) {
        rows.push({
          stepSequence: step.sequence,
          stepDescription: step.description,
          tools,
          event: ev.name || "—",
          control: c.description || "—",
          verification: c.verificationQuestion || "—",
          verificationAnswer: c.verificationAnswer ?? null,
        });
      }
    }
  }
  return rows;
}

export type BuildArtpBlocksInput = {
  organizationName: string;
  organizationLogoUrl?: string | null;
  taskName: string;
  versionNumber: number;
  status: string;
  docCode: string;
  emissionDate: string;
    workContext?: {
    workDate?: string;
    startTime?: string;
    endTime?: string;
    specificLocation?: string;
    workArea?: string;
    supervisorName?: string;
    supervisorSignatureDataUrl?: string | null;
  };
  changeAnswers?: ArtpChangeAnswer[];
  steps: ArtpStep[];
  workers: ArtpWorkerSignature[];
};

export function buildArtpDocumentBlocks(input: BuildArtpBlocksInput): InternalBlock[] {
  const blocks: InternalBlock[] = [];

  blocks.push({
    kind: "fullHeader",
    id: "hdr",
    organizationName: input.organizationName,
    organizationLogoUrl: input.organizationLogoUrl,
    taskName: input.taskName,
    versionNumber: input.versionNumber,
    status: input.status,
    docCode: input.docCode,
    emissionDate: input.emissionDate,
    heightUnits: U.fullHeader,
  });

  blocks.push({
    kind: "sectionTitle",
    id: "t-i",
    roman: "I",
    title: "Antecedentes del trabajo",
    heightUnits: U.sectionTitle,
    orphanMinFollow: U.antecedentes,
  });

  blocks.push({
    kind: "antecedentes",
    id: "ant",
    organizationName: input.organizationName,
    taskName: input.taskName,
    workDate: input.workContext?.workDate,
    startTime: input.workContext?.startTime,
    endTime: input.workContext?.endTime,
    specificLocation: input.workContext?.specificLocation,
    workArea: input.workContext?.workArea,
    supervisorName: input.workContext?.supervisorName,
    supervisorSignatureDataUrl: input.workContext?.supervisorSignatureDataUrl,
    heightUnits: U.antecedentes,
  });

  const changeAnswers = input.changeAnswers ?? [];
  if (changeAnswers.length > 0) {
    blocks.push({
      kind: "sectionTitle",
      id: "t-ii",
      roman: "II",
      title: "Gestión de cambios",
      heightUnits: U.sectionTitle,
    });

    ARTP_CHANGE_SECTIONS.forEach((section, sectionIndex) => {
      const rows = changeAnswers.filter((r) => r.category === section.category);
      if (!rows.length) return;

      blocks.push({
        kind: "changeSubTitle",
        id: `ch-sub-${section.category}`,
        sectionIndex,
        label: `${sectionIndex + 1}. ${ARTP_CHANGE_SECTION_LABELS[sectionIndex]}`,
        heightUnits: U.changeSubTitle,
      });

      rows.forEach((row, rowIndex) => {
        blocks.push({
          kind: "changeRow",
          id: `ch-${row.questionId}`,
          row,
          heightUnits:
            changeRowHeight(row) + (rowIndex === 0 ? U.changeTableHead : 0),
          subsectionTableHeadInHeight: rowIndex === 0,
        });
      });
    });
  }

  const stepRows = buildStepTableRows(input.steps);
  if (stepRows.length > 0) {
    blocks.push({
      kind: "sectionTitle",
      id: "t-iii",
      roman: "III",
      title: "Paso a paso de la tarea",
      heightUnits: U.sectionTitle,
      orphanMinFollow: U.stepTableHead + U.stepRow,
    });
    blocks.push({
      kind: "stepTableHead",
      id: "step-head",
      heightUnits: U.stepTableHead,
    });
    stepRows.forEach((row, i) => {
      blocks.push({
        kind: "stepRow",
        id: `step-${i}`,
        row,
        heightUnits: stepRowHeight(row),
      });
    });
  }

  const workers = input.workers;
  const workerCount = workers.length > 0 ? workers.length : 3;
  const rowUnits = workerRowHeightUnits(workerCount);

  blocks.push({
    kind: "sectionTitle",
    id: "t-iv",
    roman: "IV",
    title: "Trabajadores involucrados",
    heightUnits: U.sectionTitle,
    orphanMinFollow: U.workersTableHead + rowUnits,
  });
  blocks.push({ kind: "workersTableHead", id: "w-head", heightUnits: U.workersTableHead });

  if (workers.length > 0) {
    workers.forEach((worker) => {
      blocks.push({
        kind: "workerRow",
        id: `w-${worker.id}`,
        worker,
        heightUnits: rowUnits,
      });
    });
  } else {
    [1, 2, 3].forEach((n) => {
      blocks.push({
        kind: "workerRow",
        id: `w-empty-${n}`,
        emptySlot: n,
        heightUnits: rowUnits,
      });
    });
  }

  return blocks;
}

/** Solo reencabezado de tabla al continuar en otra hoja (sin repetir títulos de sección). */
function prefixesForContinuation(first: InternalBlock, pageIndex: number): InternalBlock[] {
  const suffix = String(pageIndex);
  switch (first.kind) {
    case "stepRow":
      return [{ kind: "stepTableHead", id: `step-head-${suffix}`, heightUnits: U.stepTableHead }];
    case "workerRow":
      return [{ kind: "workersTableHead", id: `w-head-${suffix}`, heightUnits: U.workersTableHead }];
    default:
      return [];
  }
}

function paginateOnce(blocks: InternalBlock[], capacity: number): InternalBlock[][] {
  const pages: InternalBlock[][] = [];
  let page: InternalBlock[] = [];
  let used = 0;

  const pageLimit = () =>
    pages.length === 0 && page.length >= 0 ? capacity + FIRST_PAGE_EXTRA_CAPACITY : capacity;

  const flush = () => {
    if (page.length > 0) pages.push(page);
    page = [];
    used = 0;
  };

  const append = (block: InternalBlock, opts?: { continuationChangeRow?: boolean }) => {
    page.push(block);
    used += block.heightUnits;
    if (
      opts?.continuationChangeRow &&
      block.kind === "changeRow" &&
      !block.subsectionTableHeadInHeight
    ) {
      used += U.changeTableHead;
    }
  };

  const beginContinuationPage = (firstBlock: InternalBlock) => {
    for (const prefix of prefixesForContinuation(firstBlock, pages.length)) {
      append(prefix);
    }
  };

  const appendBlock = (block: InternalBlock, afterPageBreak: boolean) => {
    append(block, {
      continuationChangeRow: afterPageBreak && block.kind === "changeRow",
    });
  };

  const skipsOrphanGuard = (block: InternalBlock) =>
    (block.kind === "sectionTitle" && block.roman === "II") ||
    block.kind === "changeSubTitle" ||
    block.kind === "changeRow";

  for (const block of blocks) {
    const h = block.heightUnits;
    const limit = pageLimit();
    const skipOrphanGuard = skipsOrphanGuard(block);
    const orphanNeed =
      !skipOrphanGuard && block.orphanMinFollow !== undefined
        ? h + block.orphanMinFollow
        : h;

    const orphanBreak =
      page.length > 0 &&
      !skipOrphanGuard &&
      block.orphanMinFollow !== undefined &&
      used + orphanNeed > limit;
    const spaceBreak = page.length > 0 && used + h > limit;

    if (orphanBreak || spaceBreak) {
      flush();
      beginContinuationPage(block);
      const limitAfterFlush = pageLimit();
      if (used + h > limitAfterFlush && page.length > 0) {
        flush();
        beginContinuationPage(block);
      }
      appendBlock(block, true);
      continue;
    }

    if (page.length === 0 && pages.length > 0) {
      beginContinuationPage(block);
    }

    appendBlock(block, false);
  }

  flush();
  return pages;
}

function allSourceBlocksPresent(source: InternalBlock[], pages: InternalBlock[][]): boolean {
  const remaining = new Set(source.map((b) => b.id));
  for (const page of pages) {
    for (const block of page) {
      remaining.delete(block.id);
    }
  }
  return remaining.size === 0;
}

export function paginateArtpDocumentBlocks(
  blocks: InternalBlock[],
  capacity: number = ARTP_SHEET_BODY_CAPACITY
): ArtpDocBlock[][] {
  let tryCapacity = capacity;
  let pages = paginateOnce(blocks, tryCapacity);
  let attempts = 0;

  while (!allSourceBlocksPresent(blocks, pages) && attempts < 8) {
    tryCapacity -= 4;
    pages = paginateOnce(blocks, tryCapacity);
    attempts += 1;
  }

  return pages.map((p) =>
    p.map(({ heightUnits: _h, orphanMinFollow: _o, ...rest }) => rest as ArtpDocBlock)
  );
}
