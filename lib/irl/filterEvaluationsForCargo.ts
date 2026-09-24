/** Filtra evaluaciones IPER aplicables a un cargo (misma lógica que envío IRL). */
export function evaluationMatchesCargo(
  evCargo: string | undefined,
  targetCargo: string
): boolean {
  if (!evCargo || !targetCargo.trim()) return false;
  const target = targetCargo.trim().toLowerCase();
  return evCargo
    .split(/[,/;•]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .some((token) => token === target);
}

export function filterEvaluationsForCargo<T extends { cargo?: string }>(
  evaluations: T[] | undefined | null,
  targetCargo: string
): T[] {
  if (!evaluations?.length || !targetCargo.trim()) return [];
  return evaluations.filter((ev) => evaluationMatchesCargo(ev.cargo, targetCargo));
}
