"use client";

import { useState } from "react";
import axios from "axios";
import { getSession } from "next-auth/react";
import { LuCloudDownload, LuLoaderCircle } from "react-icons/lu";
import clsx from "clsx";

type ExportTableButtonProps = {
  endpoint: string;
  queryParams?: Record<string, string | undefined>;
  downloadFilename?: string;
  label?: string;
  className?: string;
};

const EXPORT_QUERY_SKIP = new Set(["page", "page_size"]);

const buildExportQueryString = (queryParams: Record<string, string | undefined>): string => {
  const search = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (!value || EXPORT_QUERY_SKIP.has(key)) {
      return;
    }
    search.set(key, value);
  });
  return search.toString();
};

const getContentDisposition = (headers: Record<string, string>): string | undefined => {
  const key = Object.keys(headers).find(
    (header) => header.toLowerCase() === "content-disposition",
  );
  return key ? headers[key] : undefined;
};

const parseFilename = (contentDisposition: string | undefined): string | null => {
  if (!contentDisposition) {
    return null;
  }
  const quoted = contentDisposition.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) {
    return quoted[1];
  }
  const unquoted = contentDisposition.match(/filename=([^;]+)/i);
  return unquoted?.[1]?.trim() ?? null;
};

const parseExportError = async (error: unknown): Promise<string> => {
  if (!axios.isAxiosError(error) || !error.response?.data) {
    return "No se pudo exportar la tabla. Inténtalo de nuevo.";
  }

  const data = error.response.data;
  if (data instanceof Blob) {
    try {
      const payload = JSON.parse(await data.text()) as Record<string, unknown>;
      const exportError = payload.export;
      if (Array.isArray(exportError) && exportError[0]) {
        return String(exportError[0]);
      }
      if (typeof payload.detail === "string") {
        return payload.detail;
      }
    } catch {
      return "No se pudo exportar la tabla. Inténtalo de nuevo.";
    }
  }

  return "No se pudo exportar la tabla. Inténtalo de nuevo.";
};

const ExportTableButton = ({
  endpoint,
  queryParams = {},
  downloadFilename,
  label = "Exportar",
  className,
}: ExportTableButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const session = await getSession();
      const queryString = buildExportQueryString(queryParams);
      const baseUrl = process.env.backendHost ?? "";
      const url = `${baseUrl}${endpoint}${queryString ? `?${queryString}` : ""}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${session?.accessToken ?? ""}`,
        },
        responseType: "blob",
      });

      const filename =
        parseFilename(getContentDisposition(response.headers as Record<string, string>)) ??
        downloadFilename ??
        "exportacion.xlsx";
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setErrorMessage(await parseExportError(error));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className={clsx(
          "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-primary px-4 py-2 text-body-sm font-medium leading-[22px] text-primary transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        {isExporting ? (
          <LuLoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <LuCloudDownload className="size-4 shrink-0" aria-hidden="true" />
        )}
        {label}
      </button>
      {errorMessage && (
        <p className="max-w-xs text-right text-xs text-red-error-700" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default ExportTableButton;
