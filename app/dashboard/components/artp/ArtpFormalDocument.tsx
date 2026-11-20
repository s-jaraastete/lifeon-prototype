"use client";

import clsx from "clsx";
import { useMemo, type ReactNode } from "react";
import type { ArtpChangeAnswer, ArtpVersionDetail, ArtpWorkerSignature } from "@/types/artp";
import {
  buildArtpDocumentBlocks,
  paginateArtpDocumentBlocks,
  type ArtpDocBlock,
} from "@/lib/artp/artpDocumentPagination";
import { mergeChangeAnswersFromPlanning } from "@/lib/artp/loadArtpWizardState";

export type ArtpFormalDocumentProps = {
  organizationName: string;
  organizationLogoUrl?: string | null;
  detail: ArtpVersionDetail;
  issuedAt?: string | Date;
  className?: string;
};

function formatAnswerSiNo(value: boolean | null | undefined): string {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "—";
}

function formatCheckAnswer(value: string | null | undefined): string {
  if (value === "si") return "Sí";
  if (value === "no") return "No";
  if (value === "no_aplica") return "N/A";
  return "—";
}

function formatTimeDisplay(value: string | undefined): string {
  if (!value?.trim()) return "—";
  return value.trim().slice(0, 5);
}

function SectionTitle({ roman, title }: { roman: string; title: string }) {
  return (
    <h2 className="text-xs font-bold uppercase text-gray-900 border-b border-gray-300 pb-1 mb-2 shrink-0">
      {roman}. {title}
    </h2>
  );
}

function ArtpSheet({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="irl-a4-sheet irl-letter-sheet border border-gray-300 rounded-sm text-gray-800 flex flex-col print:rounded-none bg-white">
      <div className="irl-letter-sheet__body">{children}</div>
      {footer}
    </div>
  );
}

function ArtpSheetFooter(props: {
  organizationName: string;
  docCode: string;
  taskName: string;
  pageNumber: number;
  totalPages: number;
}) {
  return (
    <footer className="irl-a4-sheet-footer shrink-0">
      <span className="irl-a4-sheet-footer__watermark" aria-hidden>
        {props.organizationName}
      </span>
      <div className="irl-a4-sheet-footer__meta">
        <p className="font-semibold text-gray-700">{props.organizationName}</p>
        <p>
          ARTP · {props.docCode} · {props.taskName}
        </p>
        <p>
          Documento de uso interno — Gestión de Riesgos · Hoja {props.pageNumber} de{" "}
          {props.totalPages}
        </p>
      </div>
    </footer>
  );
}

function renderPageBlocks(blocks: ArtpDocBlock[]): ReactNode {
  const nodes: ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.kind === "fullHeader") {
      nodes.push(
        <header key={block.id} className="border-b-2 border-gray-900 pb-3 shrink-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
            <div className="flex items-start gap-3 min-w-0 pr-2">
              {block.organizationLogoUrl ? (
                <div className="flex-shrink-0 flex items-center justify-center max-w-[72px] max-h-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={block.organizationLogoUrl}
                    alt={`Logo ${block.organizationName}`}
                    className="object-contain w-auto h-auto max-w-[72px] max-h-16"
                  />
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {block.organizationName}
                </p>
                <h1 className="text-[15px] sm:text-base font-bold text-gray-900 uppercase tracking-tight mt-1 leading-snug">
                  Análisis de Riesgo de la Tarea Planificada (ARTP)
                </h1>
                <p className="text-[10px] text-gray-600 mt-1 leading-snug">{block.taskName}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Versión {block.versionNumber} · {block.status}
                </span>
              </div>
            </div>
            <div className="text-right text-[10px] leading-relaxed font-mono text-gray-800 flex-shrink-0 pt-0.5">
              <p>
                <span className="text-gray-500 font-sans font-semibold">Código:</span>
                <br />
                <span className="font-bold text-gray-900">{block.docCode}</span>
              </p>
              <p className="mt-1.5">
                <span className="text-gray-500 font-sans font-semibold">Fecha:</span>
                <br />
                <span className="font-bold text-gray-900">{block.emissionDate}</span>
              </p>
            </div>
          </div>
        </header>
      );
      i += 1;
      continue;
    }

    if (block.kind === "sectionTitle") {
      nodes.push(
        <SectionTitle key={block.id} roman={block.roman} title={block.title} />
      );
      i += 1;
      continue;
    }

    if (block.kind === "antecedentes") {
      nodes.push(
        <div
          key={block.id}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 border border-gray-200 rounded-xl p-4"
        >
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Empresa</span>
            <span className="font-bold text-gray-900">{block.organizationName}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Tarea / ARTP</span>
            <span className="font-bold text-gray-900">{block.taskName}</span>
          </div>
          <div className="sm:col-span-2 grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Fecha</span>
              <span className="font-semibold">{block.workDate || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Hora inicio</span>
              <span className="font-semibold tabular-nums">{formatTimeDisplay(block.startTime)}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Hora término</span>
              <span className="font-semibold tabular-nums">{formatTimeDisplay(block.endTime)}</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Lugar específico</span>
            <span className="font-semibold">{block.specificLocation || "—"}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Área de trabajo</span>
            <span className="font-semibold">{block.workArea || "—"}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">
              Supervisor responsable
            </span>
            <span className="font-semibold">{block.supervisorName || "—"}</span>
            {block.supervisorSignatureDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.supervisorSignatureDataUrl}
                alt=""
                className="mt-2 max-h-14 max-w-[180px] object-contain"
              />
            ) : (
              <div className="mt-3 artp-signature-line max-w-xs" />
            )}
          </div>
        </div>
      );
      i += 1;
      continue;
    }

    if (block.kind === "changeSubTitle") {
      nodes.push(
        <h3 key={block.id} className="text-[11px] font-bold text-gray-800 mb-1 shrink-0">
          {block.label}
        </h3>
      );
      i += 1;
      continue;
    }

    if (block.kind === "changeRow") {
      while (i < blocks.length && blocks[i].kind === "changeRow") {
        const segment: ArtpChangeAnswer[] = [];
        const firstRow = (blocks[i] as Extract<ArtpDocBlock, { kind: "changeRow" }>).row;
        const category = firstRow.category;
        while (i < blocks.length && blocks[i].kind === "changeRow") {
          const row = (blocks[i] as Extract<ArtpDocBlock, { kind: "changeRow" }>).row;
          if (segment.length > 0 && row.category !== category) break;
          segment.push(row);
          i += 1;
        }
        nodes.push(
          <div
            key={`${block.id}-tbl-${segment[0]?.questionId ?? i}`}
            className="artp-print-table border border-gray-300 rounded-sm mb-2"
          >
            <table className="min-w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="border-r border-gray-300 px-2 py-2 text-left font-bold">Pregunta</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold w-14">
                    Sí/No
                  </th>
                  <th className="px-2 py-2 text-left font-bold">Detalle (si No)</th>
                </tr>
              </thead>
              <tbody>
                {segment.map((row) => (
                  <tr key={row.questionId} className="border-b border-gray-200 align-top">
                    <td className="border-r border-gray-200 px-2 py-2">{row.question}</td>
                    <td className="border-r border-gray-200 px-2 py-2 text-center font-bold">
                      {formatAnswerSiNo(row.answer)}
                    </td>
                    <td className="px-2 py-2">
                      {row.answer === false ? (
                        <div className="space-y-1">
                          <p>
                            <span className="font-semibold">Cambio:</span>{" "}
                            {row.changeDescription || "—"}
                          </p>
                          <p>
                            <span className="font-semibold">Evento:</span>{" "}
                            {row.undesiredEvent || "—"}
                          </p>
                          <p>
                            <span className="font-semibold">Controles ad.:</span>{" "}
                            {row.additionalControl || "—"}
                          </p>
                          <p>
                            <span className="font-semibold">Verificación:</span>{" "}
                            {formatAnswerSiNo(row.implementationVerified)}
                          </p>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (block.kind === "stepTableHead" || block.kind === "stepRow") {
      const includeHead = block.kind === "stepTableHead";
      const stepRows = [];
      let j = i + (includeHead ? 1 : 0);
      while (j < blocks.length && blocks[j].kind === "stepRow") {
        stepRows.push((blocks[j] as Extract<ArtpDocBlock, { kind: "stepRow" }>).row);
        j += 1;
      }
      nodes.push(
        <div key={`step-tbl-${block.id}`} className="artp-print-table border border-gray-300 rounded-sm">
          <table className="min-w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="border-r border-gray-300 px-2 py-2 text-left font-bold w-10">N°</th>
                <th className="border-r border-gray-300 px-2 py-2 text-left font-bold">Paso significativo</th>
                <th className="border-r border-gray-300 px-2 py-2 text-left font-bold">Herramientas / equipos</th>
                <th className="border-r border-gray-300 px-2 py-2 text-left font-bold">Evento no deseado</th>
                <th className="border-r border-gray-300 px-2 py-2 text-left font-bold">Controles</th>
                <th className="border-r border-gray-300 px-2 py-2 text-left font-bold">Pregunta clave</th>
                <th className="px-2 py-2 text-center font-bold w-10">Resp.</th>
              </tr>
            </thead>
            <tbody>
              {stepRows.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-200 align-top">
                  <td className="border-r border-gray-200 px-2 py-2 font-bold text-center">
                    {row.stepSequence}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-2 font-semibold">
                    {row.stepDescription}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-2">{row.tools}</td>
                  <td className="border-r border-gray-200 px-2 py-2">{row.event}</td>
                  <td className="border-r border-gray-200 px-2 py-2">{row.control}</td>
                  <td className="border-r border-gray-200 px-2 py-2 text-gray-600">
                    {row.verification}
                  </td>
                  <td className="px-2 py-2 text-center font-bold">
                    {formatCheckAnswer(row.verificationAnswer ?? undefined)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j;
      continue;
    }

    if (block.kind === "workersTableHead" || block.kind === "workerRow") {
      const workerRows: { worker?: ArtpWorkerSignature; emptySlot?: number }[] = [];
      let j = i + (block.kind === "workersTableHead" ? 1 : 0);
      while (j < blocks.length && blocks[j].kind === "workerRow") {
        const wr = blocks[j] as Extract<ArtpDocBlock, { kind: "workerRow" }>;
        workerRows.push({ worker: wr.worker, emptySlot: wr.emptySlot });
        j += 1;
      }
      const count = workerRows.length;
      const tableClass = clsx(
        "artp-print-table border border-gray-300 rounded-sm",
        count >= 6 && "artp-workers-table--dense",
        count >= 3 && count < 6 && "artp-workers-table--compact"
      );
      const nameCellClass =
        count >= 6 ? "px-2 py-1 border-r border-gray-200 font-semibold" : count >= 3
          ? "px-2 py-1.5 border-r border-gray-200 font-semibold"
          : "px-3 py-2 border-r border-gray-200 font-semibold";
      const signCellClass =
        count >= 6 ? "px-2 py-1 align-bottom" : count >= 3 ? "px-2 py-1.5 align-bottom" : "px-3 py-2 align-bottom";
      const imgClass =
        count >= 6 ? "max-h-8 max-w-[120px] object-contain" : count >= 3
          ? "max-h-10 max-w-[140px] object-contain"
          : "max-h-14 max-w-[160px] object-contain";

      nodes.push(
        <div key={`workers-${block.id}`} className={tableClass}>
          <table className="min-w-full text-[10px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-2 py-1.5 text-left font-bold border-r border-gray-300 w-[45%]">
                  Nombre
                </th>
                <th className="px-2 py-1.5 text-left font-bold">Firma</th>
              </tr>
            </thead>
            <tbody>
              {workerRows.map((wr, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className={nameCellClass}>
                    {wr.worker ? (
                      wr.worker.workerName
                    ) : (
                      <span className="text-gray-400">________________________________</span>
                    )}
                  </td>
                  <td className={signCellClass}>
                    {wr.worker?.signatureDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={wr.worker.signatureDataUrl} alt="" className={imgClass} />
                    ) : (
                      <div className="artp-signature-line w-full" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j;
      continue;
    }

    i += 1;
  }

  return nodes;
}

export default function ArtpFormalDocument({
  organizationName,
  organizationLogoUrl,
  detail,
  issuedAt,
  className = "",
}: ArtpFormalDocumentProps) {
  const planning = detail.planning;
  const wc = planning?.workContext;
  const emissionDate = wc?.workDate
    ? new Date(wc.workDate).toLocaleDateString("es-CL")
    : issuedAt
      ? new Date(issuedAt).toLocaleDateString("es-CL")
      : new Date().toLocaleDateString("es-CL");

  const docCode =
    detail.document.code ||
    `ARTP-${detail.version.versionNumber}`.replace(/\s+/g, "-").toUpperCase();

  const mergedChangeAnswers = useMemo(
    () => mergeChangeAnswersFromPlanning(planning?.changeAnswers),
    [planning?.changeAnswers]
  );

  const pages = useMemo(() => {
    const internal = buildArtpDocumentBlocks({
      organizationName,
      organizationLogoUrl,
      taskName: detail.version.taskName,
      versionNumber: detail.version.versionNumber,
      status: detail.version.status,
      docCode,
      emissionDate,
      workContext: wc,
      changeAnswers: mergedChangeAnswers,
      steps: detail.steps,
      workers: planning?.workers ?? [],
    });
    return paginateArtpDocumentBlocks(internal);
  }, [
    organizationName,
    organizationLogoUrl,
    detail,
    docCode,
    emissionDate,
    wc,
    mergedChangeAnswers,
    planning?.workers,
  ]);

  const totalPages = pages.length;

  return (
    <div className={`irl-a4-document-stack w-full ${className}`}>
      {pages.map((pageBlocks, index) => (
        <ArtpSheet
          key={index}
          footer={
            <ArtpSheetFooter
              organizationName={organizationName}
              docCode={docCode}
              taskName={detail.version.taskName}
              pageNumber={index + 1}
              totalPages={totalPages}
            />
          }
        >
          {renderPageBlocks(pageBlocks)}
        </ArtpSheet>
      ))}
    </div>
  );
}
