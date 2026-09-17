"use client";

import clsx from "clsx";
import { LuCreditCard, LuDownload, LuEllipsis, LuInfo, LuMail } from "react-icons/lu";
import { Subscription } from "@/types/admin";
import DetailPanel, {
  DetailActions,
  DetailSectionList,
  type DetailSectionConfig,
} from "@/app/(auth_admin)/admin/components/shared/detail/DetailPanel";
import {
  BILLING_STATUS_LABELS,
  BILLING_STATUS_STYLES,
  DISPLAY_FALLBACK,
  formatBillingCreditNoteAmount,
  formatBillingDate,
  getBillingId,
  getCreditNoteBreakdown,
  getCreditNoteId,
} from "../../utils/billingDisplay";

type CreditNoteDetailPanelProps = {
  open: boolean;
  subscription: Subscription | null;
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

export default function CreditNoteDetailPanel({
  open,
  subscription,
  onClose,
}: CreditNoteDetailPanelProps) {
  if (!subscription) {
    return <DetailPanel open={open} onClose={onClose} title={PanelTitle} />;
  }

  const breakdown = getCreditNoteBreakdown(subscription.mrr_clp);

  const sections: DetailSectionConfig[] = [
    {
      title: "Información tributaria y cliente",
      rows: [
        { label: "Cliente", value: subscription.client_name },
        // TODO: El endpoint de suscripciones no expone RUT.
        { label: "Rut", value: DISPLAY_FALLBACK },
        { label: "ID Suscripción", value: subscription.subscription_id },
      ],
    },
    {
      title: "Detalle Nota de crédito",
      rows: [
        {
          label: "Fecha de emisión",
          value: formatBillingDate(subscription.created),
        },
        // TODO: Documento de referencia derivado mientras no exista el modelo de nota de crédito.
        {
          label: "Documento de modifica",
          value: getBillingId(subscription),
        },
        // TODO: El endpoint de suscripciones no expone tipo de ajuste.
        { label: "Tipo de ajuste", value: DISPLAY_FALLBACK },
        // TODO: El endpoint de suscripciones no expone motivo del ajuste.
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
            value={formatBillingCreditNoteAmount(breakdown?.subtotal)}
          />
          <CreditNoteChargeRow
            label="IVA (19%)"
            value={formatBillingCreditNoteAmount(breakdown?.iva)}
          />
          <CreditNoteChargeRow
            label="Total ajustado"
            value={formatBillingCreditNoteAmount(breakdown?.total)}
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
            Nota de Crédito • {getCreditNoteId(subscription)}
          </h2>
          {/* TODO: Estado real desde la API de facturación; se muestra "Emitida" por defecto. */}
          <span
            className={clsx(
              "inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium",
              BILLING_STATUS_STYLES.emitida
            )}
          >
            {BILLING_STATUS_LABELS.emitida}
          </span>
        </div>
        <p className="text-sm text-neutral-secondary">
          {formatBillingCreditNoteAmount(subscription.mrr_clp)}
        </p>
      </div>

      {/* TODO: Documento de referencia real desde la API de facturación. */}
      <div className="flex items-start gap-2 rounded-xl bg-surface-tertiary p-3 text-sm text-neutral-primary">
        <LuInfo className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        <span>
          Este documento modifica/anula la Factura{" "}
          {getBillingId(subscription)} emitida.
        </span>
      </div>

      {/* TODO: Acciones sin conectar — la API de facturación no existe aún (reenvío, descarga, más acciones). */}
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
