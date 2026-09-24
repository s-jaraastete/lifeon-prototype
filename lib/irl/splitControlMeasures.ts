/** Separa medidas de control en ítems (viñetas, saltos de línea, numeración). */
export function splitControlMeasures(text?: string | null): string[] {
  if (!text?.trim()) return ["—"];
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[•●▪]/g, "\n")
    .replace(/\n\s*-\s+/g, "\n")
    .replace(/\n\s*\*\s+/g, "\n");

  const parts = normalized
    .split(/\n+/)
    .flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed) return [];
      const numbered = trimmed
        .split(/(?=\d+[\.)]\s+)/)
        .map((p) => p.replace(/^\d+[\.)]\s*/, "").trim());
      return numbered.filter(Boolean);
    })
    .map((p) => p.replace(/^[-–—]\s*/, "").trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [text.trim()];
  }
  return [...new Set(parts)];
}
