/** Evita que el navegador muestre imágenes antiguas cuando la URL de Storage no cambia. */
export function stripMediaVersion(url: string): string {
  const idx = url.indexOf("?v=");
  return idx === -1 ? url : url.slice(0, idx);
}

export function withMediaCacheBust(
  url: string | null | undefined,
  version?: string | number | null
): string | null {
  if (!url || typeof url !== "string") return null;
  const base = stripMediaVersion(url.trim());
  if (!base.startsWith("http")) return url;
  const v =
    version != null && version !== ""
      ? String(version)
      : String(Date.now());
  return `${base}?v=${v}`;
}
