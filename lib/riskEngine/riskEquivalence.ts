/**
 * MOTOR CENTRALIZADO DE EQUIVALENCIA Y EVALUACIÓN DE RIESGOS LIFEON
 *
 * Mapeo determinístico entre la evaluación cuantitativa Matriz 5x5 y
 * la escala de Valor Esperado de la Pérdida (VEP) 3x3 (alineada con DS 44 / ISL / ACHS).
 *
 * NOTA DE ARQUITECTURA:
 * Todas las conversiones entre 5x5 y VEP 3x3 se concentran exclusivamente en este archivo.
 * Ningún componente debe realizar conversiones ad-hoc en el frontend.
 * Si se define una nueva tabla normativa en el proyecto, basta con ajustar las tablas aquí.
 */

export type RiskLevel = "Bajo" | "Medio" | "Alto" | "Crítico";

export interface Vep3x3Equivalence {
  prob3x3: number;        // Escala tradicional VEP: 1 (Baja), 2 (Media), 4 (Alta)
  prob3x3Linear: number;  // Escala lineal: 1, 2, 3
  probLabel: string;      // "Baja", "Media", "Alta"
  severidad3x3: number;   // Escala tradicional VEP: 1 (Leve), 2 (Grave), 4 (Crítica/Fatal)
  severidad3x3Linear: number;
  severidadLabel: string; // "Leve", "Grave", "Crítica"
  vepScore: number;       // P x C tradicional: 1, 2, 4, 8, 16
  vepLevel: RiskLevel;
  badgeColor: string;
  evaluatedScoreLabel: string;
}

export interface Risk5x5Score {
  prob5x5: number;        // 1 a 5
  impact5x5: number;      // 1 a 5
  val5x5: number;         // 1 a 25
  level5x5: RiskLevel;
  badgeColor: string;
}

/**
 * Determina el nivel de riesgo en matriz 5x5 según puntaje (1 a 25)
 */
export function calculate5x5Level(prob5x5: number, impact5x5: number): Risk5x5Score {
  const p = Math.max(1, Math.min(5, prob5x5 || 1));
  const i = Math.max(1, Math.min(5, impact5x5 || 1));
  const val = p * i;

  let level5x5: RiskLevel = "Bajo";
  let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";

  if (val >= 16) {
    level5x5 = "Crítico";
    badgeColor = "bg-red-100 text-red-800 border-red-200";
  } else if (val >= 10) {
    level5x5 = "Alto";
    badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
  } else if (val >= 5) {
    level5x5 = "Medio";
    badgeColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  return { prob5x5: p, impact5x5: i, val5x5: val, level5x5, badgeColor };
}

/**
 * Transforma una evaluación 5x5 a su representación equivalente en VEP 3x3 de manera determinística.
 * Conserva la evaluación original 5x5 sin alterarla.
 */
export function convert5x5ToVep3x3(prob5x5: number, impact5x5: number): Vep3x3Equivalence {
  const p = Math.max(1, Math.min(5, prob5x5 || 1));
  const i = Math.max(1, Math.min(5, impact5x5 || 1));

  // Mapeo determinístico de Probabilidad 5x5 -> 3x3 VEP:
  // 1, 2 => Baja (1)
  // 3    => Media (2)
  // 4, 5 => Alta (4)
  let prob3x3 = 1;
  let prob3x3Linear = 1;
  let probLabel = "Baja";

  if (p >= 4) {
    prob3x3 = 4;
    prob3x3Linear = 3;
    probLabel = "Alta";
  } else if (p === 3) {
    prob3x3 = 2;
    prob3x3Linear = 2;
    probLabel = "Media";
  }

  // Mapeo determinístico de Severidad / Consecuencia 5x5 -> 3x3 VEP:
  // 1, 2 => Leve (1)
  // 3    => Grave (2)
  // 4, 5 => Crítica / Fatal (4)
  let severidad3x3 = 1;
  let severidad3x3Linear = 1;
  let severidadLabel = "Leve";

  if (i >= 4) {
    severidad3x3 = 4;
    severidad3x3Linear = 3;
    severidadLabel = "Crítica";
  } else if (i === 3) {
    severidad3x3 = 2;
    severidad3x3Linear = 2;
    severidadLabel = "Grave";
  }

  // Cálculo de VEP (Valor Esperado de la Pérdida) = Probabilidad x Consecuencia
  const vepScore = prob3x3 * severidad3x3;

  let vepLevel: RiskLevel = "Bajo";
  let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";

  if (vepScore >= 16) {
    vepLevel = "Crítico";
    badgeColor = "bg-red-100 text-red-800 border-red-200";
  } else if (vepScore === 8) {
    vepLevel = "Alto";
    badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
  } else if (vepScore === 4) {
    vepLevel = "Medio";
    badgeColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  return {
    prob3x3,
    prob3x3Linear,
    probLabel,
    severidad3x3,
    severidad3x3Linear,
    severidadLabel,
    vepScore,
    vepLevel,
    badgeColor,
    evaluatedScoreLabel: `VEP ${vepScore} (${vepLevel})`,
  };
}

/**
 * Evalúa directamente en escala VEP 3x3
 */
export function evaluateVep3x3(prob3x3: number, severidad3x3: number): Vep3x3Equivalence {
  const p = prob3x3 === 4 ? 4 : prob3x3 === 2 ? 2 : 1;
  const s = severidad3x3 === 4 ? 4 : severidad3x3 === 2 ? 2 : 1;
  const vepScore = p * s;

  let vepLevel: RiskLevel = "Bajo";
  let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";

  if (vepScore >= 16) {
    vepLevel = "Crítico";
    badgeColor = "bg-red-100 text-red-800 border-red-200";
  } else if (vepScore === 8) {
    vepLevel = "Alto";
    badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
  } else if (vepScore === 4) {
    vepLevel = "Medio";
    badgeColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  return {
    prob3x3: p,
    prob3x3Linear: p === 4 ? 3 : p === 2 ? 2 : 1,
    probLabel: p === 4 ? "Alta" : p === 2 ? "Media" : "Baja",
    severidad3x3: s,
    severidad3x3Linear: s === 4 ? 3 : s === 2 ? 2 : 1,
    severidadLabel: s === 4 ? "Crítica" : s === 2 ? "Grave" : "Leve",
    vepScore,
    vepLevel,
    badgeColor,
    evaluatedScoreLabel: `VEP ${vepScore} (${vepLevel})`,
  };
}
