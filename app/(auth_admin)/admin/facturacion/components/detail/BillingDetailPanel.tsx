"use client";

import clsx from "clsx";
import { LuCreditCard, LuDownload, LuEllipsis, LuMail } from "react-icons/lu";
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
  formatBillingAmount,
  formatBillingDate,
  formatBillingPaymentDetail,
  formatBillingPaymentMethod,
  getBillingId,
  getBillingStatus,
  getChargeBreakdown,
} from "../../utils/billingDisplay";

type BillingDetailPanelProps = {
  open: boolean;
  subscription: Subscription | null;
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

export default function BillingDetailPanel({
  open,
  subscription,
  onClose,
}: BillingDetailPanelProps) {
  if (!subscription) {
    return <DetailPanel open={open} onClose={onClose} title={PanelTitle} />;
  }

  const breakdown = getChargeBreakdown(subscription.mrr_clp);

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
      title: "Detalle facturación",
      rows: [
        {
          label: "Fecha de emisión",
          value: formatBillingDate(subscription.created),
        },
        // TODO: Se usa next_billing_at como vencimiento mientras no exista el endpoint de facturación.
        {
          label: "Fecha de vencimiento",
          value: formatBillingDate(subscription.next_billing_at),
        },
        // TODO: El endpoint de suscripciones no expone fecha de pago.
        { label: "Fecha de pago", value: DISPLAY_FALLBACK },
        // TODO: El endpoint de suscripciones no expone orden de compra.
        { label: "Orden de compra / Ref", value: DISPLAY_FALLBACK },
      ],
    },
    {
      title: "Desglose del cobro",
      gridClassName: "mt-5 flex flex-col gap-4",
      content: (
        <>
          <ChargeRow
            label="Subtotal neto"
            value={formatBillingAmount(breakdown?.subtotal)}
          />
          <ChargeRow
            label="IVA (19%)"
            value={formatBillingAmount(breakdown?.iva)}
          />
          <ChargeRow
            label="Total pagado"
            value={formatBillingAmount(breakdown?.total)}
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
          value: formatBillingPaymentMethod(subscription),
        },
        {
          label: "Detalle",
          value: formatBillingPaymentDetail(
            subscription.card_type,
            subscription.card_last_four
          ),
        },
      ],
    },
  ];

  return (
    <DetailPanel open={open} onClose={onClose} title={PanelTitle}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold text-neutral-primary">
            Factura • {getBillingId(subscription)}
          </h2>
          <span
            className={clsx(
              "inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium",
              BILLING_STATUS_STYLES[getBillingStatus(subscription)]
            )}
          >
            {BILLING_STATUS_LABELS[getBillingStatus(subscription)]}
          </span>
        </div>
        <p className="text-sm text-neutral-secondary">
          {formatBillingAmount(subscription.mrr_clp)}
        </p>
      </div>

      {/* TODO: Acciones sin conectar — la API de facturación no existe aún (reenvío DTE, descarga, más acciones). */}
      <DetailActions>
        <button
          type="button"
          className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5"
        >
          <LuMail className="mr-2 inline-block h-4.5 w-4.5" />
          Reenviar DTE por correo
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5"
        >
          <LuDownload className="mr-2 inline-block h-4.5 w-4.5" />
          Descargar Factura
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
