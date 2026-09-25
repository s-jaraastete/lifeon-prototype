"use client";

import { useState } from "react";
import axios from "axios";
import { getSession } from "next-auth/react";
import GenericMenu, { MenuItem } from "@/components/reusable/GenericMenu";
import Alert from "@/components/reusable/Alert";
import { LuDownload, LuEye } from "react-icons/lu";
import { Invoice } from "@/types/admin";
import {
  parseFilenameFromHeaders,
  saveBlob,
} from "@/app/(auth_admin)/admin/components/downloadFile";
import { useInvoiceDetail } from "./InvoiceDetailProvider";

type InvoiceRowActionProps = {
  invoice: Invoice;
};

// TODO: La opción de nota de crédito se mantiene para cuando el backend tenga
// el modelo; entonces se mostrará una u otra según el tipo de documento.
const InvoiceRowAction = ({ invoice }: InvoiceRowActionProps) => {
  const detail = useInvoiceDetail();
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canDownload = invoice.document_available && !!invoice.download_url;

  const parseErrorMessage = async (error: unknown): Promise<string> => {
    if (
      axios.isAxiosError(error) &&
      error.response?.data instanceof Blob
    ) {
      try {
        const payload = JSON.parse(await error.response.data.text()) as Record<string, unknown>;
        if (typeof payload.detail === "string") {
          return payload.detail;
        }
      } catch {
        // Fallback abajo.
      }
    }
    return "No se pudo descargar la factura. Inténtalo de nuevo.";
  };

  const handleDownload = async () => {
    if (!invoice.download_url) return;

    setIsDownloading(true);
    setErrorMessage(null);
    try {
      const session = await getSession();
      const response = await axios.get(invoice.download_url, {
        headers: {
          Authorization: `Bearer ${session?.accessToken ?? ""}`,
        },
        responseType: "blob",
      });

      const filename =
        parseFilenameFromHeaders(response.headers as Record<string, string>) ??
        `${invoice.invoice_number}.pdf`;
      saveBlob(response.data, filename);
    } catch (error) {
      setErrorMessage(await parseErrorMessage(error));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <GenericMenu>
      <MenuItem
        icon={<LuEye />}
        onClick={() => detail?.openInvoiceDetail(invoice)}
      >
        Ver detalle de facturación
      </MenuItem>
      <MenuItem
        icon={<LuEye />}
        onClick={() => detail?.openCreditNoteDetail(invoice)}
      >
        Ver detalle de Nota de crédito
      </MenuItem>
      {canDownload && (
        <MenuItem
          icon={<LuDownload />}
          disabled={isDownloading}
          onClick={handleDownload}
        >
          Descargar factura
        </MenuItem>
      )}
      </GenericMenu>

      <Alert
        open={errorMessage !== null}
        onClose={() => setErrorMessage(null)}
        type="error"
        title={errorMessage ?? ""}
        duration={5000}
      />
    </>
  );
};

export default InvoiceRowAction;
