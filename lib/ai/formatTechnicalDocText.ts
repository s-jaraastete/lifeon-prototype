/**
 * Normaliza saltos de línea en texto generado por IA para listas y enumeraciones.
 */
export function formatTechnicalDocSectionText(text: string): string {
  if (!text?.trim()) return text;

  let out = text.replace(/\r\n/g, "\n").trim();

  out = out.replace(/(\S)\s+(\d+\.\s)/g, "$1\n\n$2");
  out = out.replace(/(\S)\s+([-•]\s)/g, "$1\n$2");
  out = out.replace(/(\d+\.\s[^\n]+?)(\s+)(\d+\.\s)/g, "$1\n\n$3");

  return out.replace(/\n{3,}/g, "\n\n").trim();
}
