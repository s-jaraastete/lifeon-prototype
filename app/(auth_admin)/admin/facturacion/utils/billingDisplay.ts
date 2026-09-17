import { Subscription } from "@/types/admin";
import { formatDateShort } from "@/utils/formatDate";
import { formatApiAmount } from "@/utils/pricingHelpers";

export const DISPLAY_FALLBACK = "N/A" as const;

export type BillingStatus =
  | "pagada"
  | "pendiente"
  | "vencida"
  | "anulada"
  | "emitida";

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  pagada: "Pagada",
  pendiente: "Pendiente",
  vencida: "Vencida",
  anulada: "Anulada",
  emitida: "Emitida",
};

export const BILLING_STATUS_STYLES: Record<BillingStatus, string> = {
  pagada: "bg-green-100 text-green-700",
  pendiente: "bg-yellow-100 text-yellow-600",
  vencida: "bg-red-error-100 text-red-error-700",
  anulada: "bg-gray-200 text-gray-800",
  emitida: "bg-gray-100 text-neutral-secondary",
};

// TODO: Mapeo inventado sobre el endpoint de suscripciones mientras no exista
// la API de facturación/DTE. Reemplazar por el estado real de la factura.
export const getBillingStatus = (subscription: Subscription): BillingStatus => {
  switch (subscription.status) {
    case "active":
      return "pagada";
    case "pending_payment_method":
    case "pending_initial_payment":
    case "trialing":
      return "pendiente";
    case "past_due":
    case "suspended":
      return "vencida";
    default:
      return "anulada";
  }
};

// TODO: ID derivado del ID de suscripción mientras no exista el modelo de factura.
export const getBillingId = (subscription: Subscription): string =>
  subscription.subscription_id.replace(/^SUB-/, "FAC-");

export const getClientTypeLabel = (value: string | null): string =>
  value === "individual" ? "Individual" : "Organización";

export const formatBillingDate = (value: string | null | undefined): string =>
  value ? formatDateShort(value) : DISPLAY_FALLBACK;

export const formatBillingAmount = (value: number | null | undefined): string => {
  const formatted = formatApiAmount(value);
  return formatted ? `CLP $${formatted}` : DISPLAY_FALLBACK;
};

export const formatBillingPaymentMethod = (subscription: Subscription): string => {
  const method = subscription.payment_method
    ? subscription.payment_method.charAt(0).toUpperCase() +
      subscription.payment_method.slice(1)
    : "";
  const card = subscription.card_type || "";
  if (method && card) return `${method} - ${card}`;
  return method || card || "Sin cobro";
};

export const formatBillingPaymentDetail = (
  cardType: string | null,
  cardLastFour: string | null
): string => {
  if (!cardType || !cardLastFour) return DISPLAY_FALLBACK;
  return `Tarjeta ${cardType} •••• ${cardLastFour}`;
};

// TODO: Desglose derivado matemáticamente del total (IVA 19%) mientras la API
// de facturación no entregue el desglose real.
export const getChargeBreakdown = (total: number | null | undefined) => {
  if (!total) return null;
  const subtotal = Math.round(total / 1.19);
  const iva = total - subtotal;
  return { subtotal, iva, total };
};

// TODO: ID derivado del ID de suscripción mientras no exista el modelo de nota de crédito.
export const getCreditNoteId = (subscription: Subscription): string =>
  subscription.subscription_id.replace(/^SUB-/, "NC-");

// TODO: Formato de monto negativo mientras la API de facturación no entregue
// el valor real de la nota de crédito (siempre se muestra negativo).
export const formatBillingCreditNoteAmount = (
  value: number | null | undefined
): string => {
  const formatted = formatApiAmount(value ? Math.abs(value) : value);
  return formatted ? `CLP -$${formatted}` : DISPLAY_FALLBACK;
};

// TODO: Desglose del ajuste derivado matemáticamente (IVA 19%) mientras la API
// de facturación no entregue el desglose real.
export const getCreditNoteBreakdown = (total: number | null | undefined) => {
  if (!total) return null;
  const abs = Math.abs(total);
  const subtotal = Math.round(abs / 1.19);
  const iva = abs - subtotal;
  return { subtotal: -subtotal, iva: -iva, total: -abs };
};
