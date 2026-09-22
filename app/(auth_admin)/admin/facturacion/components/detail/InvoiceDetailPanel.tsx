"use client";

import clsx from "clsx";
import { LuCreditCard, LuDownload, LuEllipsis, LuMail } from "react-icons/lu";
import { Invoice } from "@/types/admin";
import DetailPanel, {
  DetailActions,
  DetailSectionList,
  type DetailSectionConfig,
} from "@/app/(auth_admin)/admin/components/shared/detail/DetailPanel";
import {
  DISPLAY_FALLBACK,
  INVOICE_STATUS_DISPLAY_LABELS,
  INVOICE_STATUS_DISPLAY_STYLES,
  formatInvoiceAmount,
  formatInvoiceDate,
  formatInvoicePaymentDetail,
  formatInvoicePaymentMethod,
  getInvoiceDisplayStatus,
} from "../../utils/invoiceDisplay";

type InvoiceDetailPanelProps = {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
};

const ChargeRow = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-sm text-neutral-primary">{label}</span>
    <span
      className={clsx(
        "text-sm",
        highlight ? "font-semibold text-secondary" : "text-neutral-primary"
      )}
    >
      {value}
    </span>
  </div>
);

const PanelTitle = (
  <div className="flex items-center gap-2.5">
    <LuCreditCard className="h-4.5 w-4.5 text-secondary" />
    Detalle de la facturación
  </div>
);

export default function InvoiceDetailPanel({
  open,
  invoice,
  onClose,
}: InvoiceDetailPanelProps) {
  if (!invoice) {
    return <DetailPanel open={open} onClose={onClose} title={PanelTitle} />;
  }

  const isDocumentReady = invoice.document_status === "ready";
  const canDownload = invoice.document_available && !!invoice.download_url;

  const sections: DetailSectionConfig[] = [
    {
      title: "Información tributaria y cliente",
      rows: [
        { label: "Cliente", value: invoice.company_name_snapshot },
        { label: "Rut", value: invoice.company_rut_snapshot || DISPLAY_FALLBACK },
        { label: "ID Suscripción", value: invoice.subscription_id },
      ],
    },
    {
      title: "Detalle facturación",
      rows: [
        { label: "Fecha de emisión", value: formatInvoiceDate(invoice.issued_at) },
        { label: "Fecha de vencimiento", value: formatInvoiceDate(invoice.due_date) },
        // TODO: El backend no expone fecha de pago.
        { label: "Fecha de pago", value: DISPLAY_FALLBACK },
        {
          label: "Orden de compra / Ref",
          value: invoice.order_number || DISPLAY_FALLBACK,
        },
      ],
    },
    {
      title: "Desglose del cobro",
      gridClassName: "mt-5 flex flex-col gap-4",
      content: (
        <>
          <ChargeRow
            label="Subtotal neto"
            value={formatInvoiceAmount(invoice.net_amount_clp)}
          />
          <ChargeRow
            label={`IVA (${invoice.tax_rate_percent}%)`}
            value={formatInvoiceAmount(invoice.tax_amount_clp)}
          />
          <ChargeRow
            label="Total pagado"
            value={formatInvoiceAmount(invoice.total_amount_clp)}
            highlight
          />
        </>
      ),
    },
    {
      title: "Método de pago",
      rows: [
        {
          label: "Modalidad",
          value: formatInvoicePaymentMethod(invoice),
        },
        {
          label: "Detalle",
          value: formatInvoicePaymentDetail(invoice.payment_method),
        },
      ],
    },
  ];

  return (
    <DetailPanel open={open} onClose={onClose} title={PanelTitle}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold text-neutral-primary">
            Factura • {invoice.invoice_number}
          </h2>
          <span
            className={clsx(
              "inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium",
              INVOICE_STATUS_DISPLAY_STYLES[getInvoiceDisplayStatus(invoice)]
            )}
          >
            {INVOICE_STATUS_DISPLAY_LABELS[getInvoiceDisplayStatus(invoice)]}
          </span>
        </div>
        <p className="text-sm text-neutral-secondary">
          {formatInvoiceAmount(invoice.total_amount_clp)}
        </p>
      </div>

      {/* TODO: "Reenviar DTE por correo" sin conectar */}
      <DetailActions>
        <button
          type="button"
          className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5"
        >
          <LuMail className="mr-2 inline-block h-4.5 w-4.5" />
          Reenviar DTE por correo
        </button>
        {canDownload ? (
          <a
            href={invoice.download_url ?? undefined}
            className="flex-1 rounded-lg border border-secondary px-4 py-2 text-center text-sm font-medium text-secondary transition-colors hover:bg-secondary/5"
          >
            <LuDownload className="mr-2 inline-block h-4.5 w-4.5" />
            Descargar Factura
          </a>
        ) : (
          <button
            type="button"
            className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5"
          >
            <LuDownload className="mr-2 inline-block h-4.5 w-4.5" />
            Descargar Factura
          </button>
        )}
        <button
          type="button"
          className="rounded-lg border border-stroke-primary p-2 text-neutral-secondary transition-colors hover:bg-surface-tertiary hover:text-secondary"
          aria-label="Más acciones"
        >
          <LuEllipsis className="h-5 w-5" />
        </button>
      </DetailActions>

      {!isDocumentReady && (
        <p className="text-xs text-neutral-secondary">
          {invoice.document_status === "failed"
            ? "No fue posible generar el documento."
            : "Documento en generación."}
        </p>
      )}

      <DetailSectionList sections={sections} />
    </DetailPanel>
  );
}
