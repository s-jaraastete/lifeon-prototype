/**
 * Colores y celdas de la matriz 5×5 / VEP 3×3 (mapa de clasificación).
 * Frecuencia (P) en eje Y ascendente hacia arriba; impacto (C) en eje X hacia la derecha.
 * Esquina superior derecha = mayor criticidad.
 */

export type HeatmapColor = "green" | "yellow" | "orange" | "red";

export interface Heatmap5x5Cell {
  val: number;
  color: HeatmapColor;
  prob: number;
  impact: number;
}

export interface HeatmapVep3x3Cell {
  prob: number;
  severidad: number;
  vep: number;
  color: HeatmapColor;
  level: "Bajo" | "Medio" | "Alto" | "Crítico";
}

/** Filas por impacto descendente (5 arriba en vista impacto×prob del dashboard). */
export const SIGNIFICANCE_GRID_5X5: Heatmap5x5Cell[][] = [
  [
    { val: 18, color: "orange", prob: 1, impact: 5 },
    { val: 19, color: "orange", prob: 2, impact: 5 },
    { val: 23, color: "red", prob: 3, impact: 5 },
    { val: 24, color: "red", prob: 4, impact: 5 },
    { val: 25, color: "red", prob: 5, impact: 5 },
  ],
  [
    { val: 12, color: "yellow", prob: 1, impact: 4 },
    { val: 16, color: "orange", prob: 2, impact: 4 },
    { val: 17, color: "orange", prob: 3, impact: 4 },
    { val: 21, color: "red", prob: 4, impact: 4 },
    { val: 22, color: "red", prob: 5, impact: 4 },
  ],
  [
    { val: 10, color: "yellow", prob: 1, impact: 3 },
    { val: 11, color: "yellow", prob: 2, impact: 3 },
    { val: 14, color: "orange", prob: 3, impact: 3 },
    { val: 15, color: "orange", prob: 4, impact: 3 },
    { val: 20, color: "red", prob: 5, impact: 3 },
  ],
  [
    { val: 4, color: "green", prob: 1, impact: 2 },
    { val: 5, color: "green", prob: 2, impact: 2 },
    { val: 8, color: "yellow", prob: 3, impact: 2 },
    { val: 9, color: "yellow", prob: 4, impact: 2 },
    { val: 13, color: "orange", prob: 5, impact: 2 },
  ],
  [
    { val: 1, color: "green", prob: 1, impact: 1 },
    { val: 2, color: "green", prob: 2, impact: 1 },
    { val: 3, color: "green", prob: 3, impact: 1 },
    { val: 6, color: "yellow", prob: 4, impact: 1 },
    { val: 7, color: "yellow", prob: 5, impact: 1 },
  ],
];

export const GRID_3X3_VEP: HeatmapVep3x3Cell[][] = [
  [
    { prob: 1, severidad: 4, vep: 4, color: "yellow", level: "Medio" },
    { prob: 2, severidad: 4, vep: 8, color: "orange", level: "Alto" },
    { prob: 4, severidad: 4, vep: 16, color: "red", level: "Crítico" },
  ],
  [
    { prob: 1, severidad: 2, vep: 2, color: "green", level: "Bajo" },
    { prob: 2, severidad: 2, vep: 4, color: "yellow", level: "Medio" },
    { prob: 4, severidad: 2, vep: 8, color: "orange", level: "Alto" },
  ],
  [
    { prob: 1, severidad: 1, vep: 1, color: "green", level: "Bajo" },
    { prob: 2, severidad: 1, vep: 2, color: "green", level: "Bajo" },
    { prob: 4, severidad: 1, vep: 4, color: "yellow", level: "Medio" },
  ],
];

export const PROB_ROWS_5X5_DESC = [5, 4, 3, 2, 1] as const;
export const IMPACT_COLS_5X5_ASC = [1, 2, 3, 4, 5] as const;
/** Filas VEP: probabilidad alta arriba (4 → 1) */
export const PROB_ROWS_VEP_DESC = [4, 2, 1] as const;
/** Columnas VEP: consecuencia de menor a mayor */
export const SEV_COLS_VEP_ASC = [1, 2, 4] as const;
/** @deprecated Usar PROB_ROWS_VEP_DESC + SEV_COLS_VEP_ASC (misma orientación que 5×5) */
export const SEV_ROWS_VEP_DESC = [4, 2, 1] as const;
export const PROB_COLS_VEP_ASC = [1, 2, 4] as const;

export function get5x5HeatmapCell(prob: number, impact: number): Heatmap5x5Cell {
  for (const row of SIGNIFICANCE_GRID_5X5) {
    const cell = row.find((c) => c.prob === prob && c.impact === impact);
    if (cell) return cell;
  }
  const val = prob * impact;
  return { prob, impact, val, color: "green" };
}

export function getVep3x3HeatmapCell(prob: number, severidad: number): HeatmapVep3x3Cell | undefined {
  for (const row of GRID_3X3_VEP) {
    const cell = row.find((c) => c.prob === prob && c.severidad === severidad);
    if (cell) return cell;
  }
  return undefined;
}

export const HEATMAP_CELL_CLASS: Record<HeatmapColor, string> = {
  green: "bg-[#4ADE80] hover:bg-[#22C55E] text-white border-[#22C55E]/50",
  yellow: "bg-[#FACC15] hover:bg-[#EAB308] text-white border-[#EAB308]/50",
  orange: "bg-[#FB923C] hover:bg-[#F97316] text-white border-[#F97316]/50",
  red: "bg-[#EF4444] hover:bg-[#DC2626] text-white border-[#DC2626]/50",
};

/** Texto mostrado dentro de cada celda del mapa de clasificación */
export const HEATMAP_LEVEL_LABEL: Record<HeatmapColor, string> = {
  green: "Bajo",
  yellow: "Medio",
  orange: "Alto",
  red: "Crítico",
};

export function heatmapLevelLabel(color: HeatmapColor): string {
  return HEATMAP_LEVEL_LABEL[color];
}
