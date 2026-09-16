"use client";

import { Fragment } from "react";
import clsx from "clsx";
import { LuLock } from "react-icons/lu";
import { convert5x5ToVep3x3 } from "@/lib/riskEngine/riskEquivalence";
import {
  PROB_5X5,
  SEV_5X5,
  PROB_5X5_AXIS,
  SEV_5X5_AXIS,
  PROB_VEP3X3,
  SEV_VEP3X3,
} from "@/lib/riskEngine/riskMatrixLabels";
import {
  get5x5HeatmapCell,
  getVep3x3HeatmapCell,
  HEATMAP_CELL_CLASS,
  heatmapLevelLabel,
  type HeatmapColor,
  IMPACT_COLS_5X5_ASC,
  PROB_ROWS_5X5_DESC,
  PROB_ROWS_VEP_DESC,
  SEV_COLS_VEP_ASC,
} from "@/lib/riskEngine/riskMatrixHeatmap";

export type RiskMapMode = "matrix5x5" | "vep3x3";

type RiskClassificationMapProps = {
  mode: RiskMapMode;
  prob: number;
  sev: number;
  onSelect: (prob: number, sev: number) => void;
  maxProb?: number;
  maxSev?: number;
  showDynamicVepHint?: boolean;
  className?: string;
};

function axisLabel5Prob(val: number) {
  return PROB_5X5_AXIS.find((a) => a.val === val)?.label ?? String(val);
}

function axisLabel5Sev(val: number) {
  return SEV_5X5_AXIS.find((a) => a.val === val)?.label ?? String(val);
}

function axisLabelVepProb(val: number) {
  const meta = PROB_VEP3X3.find((p) => p.val === val);
  return meta?.label.split(" - ")[1] || meta?.label || String(val);
}

function axisLabelVepSev(val: number) {
  const meta = SEV_VEP3X3.find((s) => s.val === val);
  return meta?.label.split(" - ")[1] || meta?.label || String(val);
}

function metaProb5(val: number) {
  return PROB_5X5.find((p) => p.val === val);
}

function metaSev5(val: number) {
  return SEV_5X5.find((s) => s.val === val);
}

const CELL_GAP = "gap-1";
const GRID_HEIGHT_5X5 = 220;
const GRID_HEIGHT_VEP = 168;

function CellButton({
  color,
  levelText,
  selected,
  locked,
  aria,
  onClick,
}: {
  color: HeatmapColor;
  levelText: string;
  selected: boolean;
  locked: boolean;
  aria: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      title={aria}
      aria-label={aria}
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        "relative rounded-md border min-h-0 w-full h-full transition cursor-pointer",
        "flex items-center justify-center px-0.5 text-center",
        HEATMAP_CELL_CLASS[color],
        locked && "opacity-40 cursor-not-allowed",
        selected && "ring-[3px] ring-slate-800/50 ring-offset-1 ring-offset-white z-10 shadow-md"
      )}
    >
      <span
        className={clsx(
          "font-bold leading-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]",
          levelText === "Crítico" ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]"
        )}
      >
        {levelText}
      </span>
      {locked && <LuLock className="w-3 h-3 absolute top-0.5 right-0.5 opacity-90" />}
    </button>
  );
}

export default function RiskClassificationMap({
  mode,
  prob,
  sev,
  onSelect,
  maxProb,
  maxSev,
  showDynamicVepHint,
  className,
}: RiskClassificationMapProps) {
  const vepHint =
    showDynamicVepHint && mode === "matrix5x5" && prob > 0 && sev > 0
      ? convert5x5ToVep3x3(prob, sev)
      : null;

  const is5x5 = mode === "matrix5x5";
  const rowCount = is5x5 ? 5 : 3;
  const colCount = is5x5 ? 5 : 3;
  const gridHeight = is5x5 ? GRID_HEIGHT_5X5 : GRID_HEIGHT_VEP;
  const rowPx = Math.floor(gridHeight / rowCount);
  const yLabelCol = is5x5 ? "6rem" : "5rem";

  const yAxisTitle = "Probabilidad";
  const xAxisTitle = "Consecuencia";

  const probRows = is5x5 ? PROB_ROWS_5X5_DESC : PROB_ROWS_VEP_DESC;
  const sevCols = is5x5 ? IMPACT_COLS_5X5_ASC : SEV_COLS_VEP_ASC;

  return (
    <div className={clsx("flex flex-col gap-3 w-full", className)}>
      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3 sm:p-4 w-full">
        <div
          className="w-full"
          style={{
            display: "grid",
            gridTemplateColumns: `auto ${yLabelCol} minmax(0, 1fr)`,
            gridTemplateRows: `repeat(${rowCount}, ${rowPx}px) auto auto`,
            columnGap: "0.5rem",
            rowGap: "0.25rem",
          }}
        >
          <div
            className="flex items-center justify-center pr-0.5"
            style={{ gridRow: `1 / span ${rowCount}`, gridColumn: 1 }}
          >
            <div
              className="h-full w-full max-h-full bg-white rounded-full px-1.5 sm:px-2 py-2 flex items-center justify-center border border-slate-200 shadow-xs"
              style={{ minHeight: gridHeight - 4 }}
            >
              <span
                className="[writing-mode:vertical-lr] rotate-180 text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-widest"
              >
                {yAxisTitle}
              </span>
            </div>
          </div>

          {probRows.map((pVal, rowIdx) => (
            <Fragment key={`row-${pVal}`}>
              <div
                className="flex items-center justify-end text-right pr-1 min-w-0"
                style={{ gridRow: rowIdx + 1, gridColumn: 2 }}
                title={
                  is5x5
                    ? metaProb5(pVal)?.desc
                    : PROB_VEP3X3.find((p) => p.val === pVal)?.desc
                }
              >
                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-700 leading-[1.15]">
                  {is5x5 ? axisLabel5Prob(pVal) : axisLabelVepProb(pVal)}
                </span>
              </div>
              <div
                className={clsx("grid min-h-0 h-full min-w-0", CELL_GAP)}
                style={{
                  gridRow: rowIdx + 1,
                  gridColumn: 3,
                  gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
                }}
              >
                {sevCols.map((sVal) => {
                  const lockedByMax =
                    (maxProb !== undefined && pVal > maxProb) ||
                    (maxSev !== undefined && sVal > maxSev);
                  const selected = prob === pVal && sev === sVal;

                  if (is5x5) {
                    const cell = get5x5HeatmapCell(pVal, sVal);
                    const levelText = heatmapLevelLabel(cell.color);
                    const aria = `Probabilidad ${axisLabel5Prob(pVal)}, Consecuencia ${axisLabel5Sev(sVal)}. Nivel ${levelText}. P×C = ${cell.val} (P${pVal}×C${sVal}).`;

                    return (
                      <CellButton
                        key={`${pVal}-${sVal}`}
                        color={cell.color}
                        levelText={levelText}
                        selected={selected}
                        locked={lockedByMax}
                        aria={aria}
                        onClick={() => !lockedByMax && onSelect(pVal, sVal)}
                      />
                    );
                  }

                  const cell = getVep3x3HeatmapCell(pVal, sVal);
                  const color = cell?.color ?? "green";
                  const levelText = heatmapLevelLabel(color);
                  const score = cell?.vep ?? pVal * sVal;
                  const aria = `Probabilidad ${axisLabelVepProb(pVal)}, Consecuencia ${axisLabelVepSev(sVal)}. Nivel ${levelText}. P×C = ${score}.`;

                  return (
                    <CellButton
                      key={`${pVal}-${sVal}`}
                      color={color}
                      levelText={levelText}
                      selected={selected}
                      locked={lockedByMax || !cell}
                      aria={aria}
                      onClick={() => cell && !lockedByMax && onSelect(pVal, sVal)}
                    />
                  );
                })}
              </div>
            </Fragment>
          ))}

          <div style={{ gridRow: rowCount + 1, gridColumn: 3 }} className="pt-1 min-w-0">
            <div
              className={clsx(
                "grid text-center text-[9px] sm:text-[10px] font-semibold text-gray-700 leading-tight min-w-0",
                CELL_GAP
              )}
              style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
            >
              {sevCols.map((sVal) => (
                <span
                  key={sVal}
                  className="px-0.5 truncate"
                  title={
                    is5x5
                      ? metaSev5(sVal)?.desc
                      : SEV_VEP3X3.find((s) => s.val === sVal)?.desc
                  }
                >
                  {is5x5 ? axisLabel5Sev(sVal) : axisLabelVepSev(sVal)}
                </span>
              ))}
            </div>
          </div>

          <div style={{ gridRow: rowCount + 2, gridColumn: 3 }} className="pt-0.5">
            <div className="bg-white rounded-full py-1.5 text-center border border-slate-200 shadow-xs">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {xAxisTitle}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-gray-200/80">
          {(["green", "yellow", "orange", "red"] as HeatmapColor[]).map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-600"
            >
              <span
                className={clsx("w-3 h-3 rounded-sm border", HEATMAP_CELL_CLASS[c])}
                aria-hidden
              />
              {heatmapLevelLabel(c)}
            </span>
          ))}
        </div>
      </div>

      {vepHint && (
        <p className="text-[11px] text-teal-800 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
          Equivalencia VEP (solo lectura): {vepHint.evaluatedScoreLabel}
        </p>
      )}
    </div>
  );
}
