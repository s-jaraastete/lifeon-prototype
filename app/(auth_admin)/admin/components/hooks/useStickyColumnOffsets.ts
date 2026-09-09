"use client";

import { RefObject, useLayoutEffect } from "react";

const clearSticky = (table: HTMLTableElement) => {
  for (const cell of Array.from(table.querySelectorAll<HTMLElement>("[data-sticky]"))) {
    cell.removeAttribute("data-sticky");
    cell.removeAttribute("data-sticky-edge");
    cell.style.removeProperty("--sticky-right");
  }
};

const useStickyColumnOffsets = (
  ref: RefObject<HTMLTableElement | null>,
  stickyRightColumns: number
) => {
  useLayoutEffect(() => {
    const table = ref.current;
    if (!table) return;
    if (stickyRightColumns < 1) {
      clearSticky(table);
      return;
    }

    const totalColumns = table.querySelectorAll("thead tr th").length;

    const getColumnCells = (fromRight: number): HTMLElement[] => {
      const selector = fromRight === 1 ? ":last-child" : `:nth-last-child(${fromRight})`;
      const heads = Array.from(table.querySelectorAll<HTMLElement>(`thead th${selector}`));
      const bodies = Array.from(
        table.querySelectorAll<HTMLElement>(`tbody tr td${selector}`)
      ).filter((cell) => !(cell instanceof HTMLTableCellElement && cell.colSpan > 1));
      return [...heads, ...bodies];
    };

    const measure = () => {
      clearSticky(table);
      const validCount = Math.min(stickyRightColumns, totalColumns);
      let cumulative = 0;

      for (let k = 1; k <= validCount; k += 1) {
        const width = getColumnCells(k).reduce(
          (max, cell) => Math.max(max, cell.offsetWidth),
          0
        );
        const right = k === 1 ? 0 : cumulative;
        cumulative += width;

        const cells = getColumnCells(k);
        if (cells.length === 0) continue;
        const isLeftEdge = k === validCount;
        for (const cell of cells) {
          cell.setAttribute("data-sticky", "");
          cell.style.setProperty("--sticky-right", `${right}px`);
          if (isLeftEdge) {
            cell.setAttribute("data-sticky-edge", "");
          }
        }
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(table);
    return () => {
      observer.disconnect();
      clearSticky(table);
    };
  }, [ref, stickyRightColumns]);
};

export default useStickyColumnOffsets;
