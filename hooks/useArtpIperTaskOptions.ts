"use client";

import { useMemo } from "react";
import { useIperMatrices } from "@/hooks/useIperMatrices";

export type ArtpIperTaskOption = {
  taskName: string;
  matrixId: string;
  matrixLabel: string;
};

export function useArtpIperTaskOptions(): ArtpIperTaskOption[] {
  const { vigentesMatrices } = useIperMatrices();

  return useMemo(() => {
    const map = new Map<string, ArtpIperTaskOption>();
    for (const matrix of vigentesMatrices) {
      const matrixLabel = matrix.title || matrix.name || matrix.code;
      const evals = matrix.evaluations ?? [];
      for (const ev of evals) {
        const taskName = ev.task?.trim();
        if (!taskName) continue;
        const key = `${matrix.id}::${taskName.toLowerCase()}`;
        if (!map.has(key)) {
          map.set(key, { taskName, matrixId: matrix.id, matrixLabel });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.taskName.localeCompare(b.taskName, "es")
    );
  }, [vigentesMatrices]);
}
