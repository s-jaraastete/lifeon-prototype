"use client";

import clsx from "clsx";
import { LuCreditCard, LuDownload, LuEllipsis, LuInfo, LuMail } from "react-icons/lu";
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
  formatInvoiceCreditNoteAmount,
  formatInvoiceDate,
  getCreditNoteBreakdown,
  getCreditNoteId,
} from "../../utils/invoiceDisplay";

type CreditNoteDetailPanelProps = {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
};

const CreditNoteChargeRow = ({
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
        highlight ? "font-semibold text-red-error-600" : "text-neutral-primary"
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

// TODO: El backend no tiene modelo de nota de crédito. Este panel queda como
// referencia futura: los IDs, montos, desglose, tipo de ajuste y motivo son
// inventados a partir de la factura seleccionada.
export default function CreditNoteDetailPanel({
  open,
  invoice,
  onClose,
}: CreditNoteDetailPanelProps) {
  if (!invoice) {
    return <DetailPanel open={open} onClose={onClose} title={PanelTitle} />;
  }

  const breakdown = getCreditNoteBreakdown(invoice.total_amount_clp);

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
      title: "Detalle Nota de crédito",
      rows: [
        { label: "Fecha de emisión", value: formatInvoiceDate(invoice.issued_at) },
        { label: "Documento de modifica", value: invoice.invoice_number },
        // TODO: El backend no expone tipo de ajuste.
        { label: "Tipo de ajuste", value: DISPLAY_FALLBACK },
        // TODO: El backend no expone motivo del ajuste.
        { label: "Motivo", value: DISPLAY_FALLBACK },
      ],
    },
    {
      title: "Desglose del ajuste",
      gridClassName: "mt-5 flex flex-col gap-4",
      content: (
        <>
          <CreditNoteChargeRow
            label="Subtotal neto"
            value={formatInvoiceCreditNoteAmount(breakdown?.subtotal)}
          />
          <CreditNoteChargeRow
            label="IVA (19%)"
            value={formatInvoiceCreditNoteAmount(breakdown?.iva)}
          />
          <CreditNoteChargeRow
            label="Total ajustado"
            value={formatInvoiceCreditNoteAmount(breakdown?.total)}
            highlight
          />
        </>
      ),
    },
  ];

  return (
    <DetailPanel open={open} onClose={onClose} title={PanelTitle}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold text-neutral-primary">
            Nota de Crédito • {getCreditNoteId(invoice)}
          </h2>
          <span
            className={clsx(
              "inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium",
              INVOICE_STATUS_DISPLAY_STYLES.emitida
            )}
          >
            {INVOICE_STATUS_DISPLAY_LABELS.emitida}
          </span>
        </div>
        <p className="text-sm text-neutral-secondary">
          {formatInvoiceCreditNoteAmount(invoice.total_amount_clp)}
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-info-subtle p-3 text-sm text-neutral-primary">
        <LuInfo className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        <span>
          Este documento modifica/anula la Factura {invoice.invoice_number}{" "}
          emitida.
        </span>
      </div>

      {/* TODO: Acciones sin conectar — el backend no tiene notas de crédito. */}
      <DetailActions>
        <button
          type="button"
          className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5"
        >
          <LuMail className="mr-2 inline-block h-4.5 w-4.5" />
          Reenviar Nota de crédito
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5"
        >
          <LuDownload className="mr-2 inline-block h-4.5 w-4.5" />
          Descargar Nota de crédito
        </button>
        <button
          type="button"
          className="rounded-lg border border-stroke-primary p-2 text-neutral-secondary transition-colors hover:bg-surface-tertiary hover:text-secondary"
          aria-label="Más acciones"
        >
          <LuEllipsis className="h-5 w-5" />
        </button>
      </DetailActions>

      <DetailSectionList sections={sections} />
    </DetailPanel>
  );
}
