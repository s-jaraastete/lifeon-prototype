import { Subscription, SubscriptionStatus } from "@/types/admin";
import { formatDateShort } from "@/utils/formatDate";
import { formatApiAmount } from "@/utils/pricingHelpers";

export const DISPLAY_FALLBACK = "N/A" as const;

// TODO: Revisar labels con respecto a multiples status pendientes de pago
export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  pending_payment_method: /* "Pendiente método de pago" */ "Pendiente",
  pending_initial_payment: "Pendiente de pago inicial",
  trialing: "En prueba",
  active: "Activa",
  past_due: "Vencida",
  suspended: "Suspendida",
  cancelled: "Cancelada",
  expired: "Expirada",
  // plan_free: "Plan free",
};

export const SUBSCRIPTION_STATUS_STYLES: Record<SubscriptionStatus, string> = {
  pending_payment_method: "bg-yellow-100 text-yellow-600",
  pending_initial_payment: "bg-yellow-100 text-yellow-600",
  trialing: "bg-lavender-100 text-lavender-700",
  active: "bg-green-100 text-green-700",
  past_due: "bg-red-error-100 text-red-error-700",
  suspended: "bg-orange-100 text-orange-600",
  cancelled: "bg-red-error-100 text-red-error-700",
  expired: "bg-red-error-100 text-red-error-700",
};

export const getClientTypeLabel = (value: string | null): string =>
  value === "individual" ? "Individual" : "Organización";

export const getBillingPeriodLabel = (period: Subscription["billing_period"]): string =>
  period === "monthly" ? "Mensual" : "Anual";

export const getPaymentMethodLabel = (value: string | null): string => {
  if (!value) return DISPLAY_FALLBACK;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const formatPaymentDetail = (
  cardType: string | null,
  cardLastFour: string | null
): string => {
  if (!cardType || !cardLastFour) return DISPLAY_FALLBACK;
  return `Tarjeta ${cardType} •••• ${cardLastFour}`;
};

export const formatPaymentMethod = (sub: Subscription): string => {
  const method = sub.payment_method
    ? sub.payment_method.charAt(0).toUpperCase() + sub.payment_method.slice(1)
    : "";
  const card = sub.card_type || "";
  if (method && card) return `${method} - ${card}`;
  return method || card || "Sin cobro";
};

export const formatSubscriptionDate = (value: string | null | undefined): string =>
  value ? formatDateShort(value) : DISPLAY_FALLBACK;

export const getDisplayValue = (value: string | null | undefined): string =>
  value?.trim() ? value : DISPLAY_FALLBACK;

export const getMrrDisplay = (value: number | null | undefined): string => {
  const formatted = formatApiAmount(value);
  return formatted ? `$${formatted} CLP` : DISPLAY_FALLBACK;
};

export const getPlanWithClientTypeLabel = (
  packName: string | null | undefined,
  clientType: string | null
): string => {
  const pack = packName?.trim() ? packName : DISPLAY_FALLBACK;
  return `${pack} / ${getClientTypeLabel(clientType)}`;
};
