export const getContentDisposition = (
  headers: Record<string, string>
): string | undefined => {
  const key = Object.keys(headers).find(
    (header) => header.toLowerCase() === "content-disposition"
  );
  return key ? headers[key] : undefined;
};

export const parseFilenameFromHeaders = (
  headers: Record<string, string>
): string | null => {
  const contentDisposition = getContentDisposition(headers);
  if (!contentDisposition) return null;
  const quoted = contentDisposition.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  const unquoted = contentDisposition.match(/filename=([^;]+)/i);
  return unquoted?.[1]?.trim() ?? null;
};

export const saveBlob = (blob: Blob, filename: string): void => {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
};
