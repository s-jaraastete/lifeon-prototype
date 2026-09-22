import { Invoice, InvoicePaymentMethod, InvoiceStatus } from "@/types/admin";
import { formatDateShort } from "@/utils/formatDate";
import { formatApiAmount } from "@/utils/pricingHelpers";

export const DISPLAY_FALLBACK = "N/A" as const;

export type InvoiceDisplayStatus =
  | "pagada"
  | "pendiente"
  | "vencida"
  | "anulada"
  | "emitida";

export const INVOICE_STATUS_DISPLAY_LABELS: Record<InvoiceDisplayStatus, string> = {
  pagada: "Pagada",
  pendiente: "Pendiente",
  vencida: "Vencida",
  anulada: "Anulada",
  emitida: "Emitida",
};

export const INVOICE_STATUS_DISPLAY_STYLES: Record<InvoiceDisplayStatus, string> = {
  pagada: "bg-green-100 text-green-700",
  pendiente: "bg-yellow-100 text-yellow-600",
  vencida: "bg-red-error-100 text-red-error-700",
  anulada: "bg-gray-200 text-gray-800",
  emitida: "bg-gray-100 text-neutral-secondary",
};

const INVOICE_STATUS_TO_DISPLAY: Record<InvoiceStatus, InvoiceDisplayStatus> = {
  paid: "pagada",
  pending: "pendiente",
  overdue: "vencida",
  cancelled: "anulada",
  issued: "emitida",
};

export const getInvoiceDisplayStatus = (invoice: Invoice): InvoiceDisplayStatus =>
  INVOICE_STATUS_TO_DISPLAY[invoice.status];

export const formatInvoiceDate = (value: string | null | undefined): string =>
  value ? formatDateShort(value) : DISPLAY_FALLBACK;

export const formatInvoiceAmount = (value: number | null | undefined): string => {
  const formatted = formatApiAmount(value);
  return formatted ? `CLP $${formatted}` : DISPLAY_FALLBACK;
};

export const formatInvoicePaymentMethod = (invoice: Invoice): string => {
  const provider = invoice.payment_method?.provider;
  if (!provider) return "Sin cobro";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
};

export const formatInvoicePaymentDetail = (
  paymentMethod: InvoicePaymentMethod | null
): string => {
  if (!paymentMethod?.card_type || !paymentMethod.card_last_four) {
    return DISPLAY_FALLBACK;
  }
  return `Tarjeta ${paymentMethod.card_type} •••• ${paymentMethod.card_last_four}`;
};

// TODO: El backend no tiene modelo de nota de crédito; ID derivado del número
// de factura mientras no exista la API real.
export const getCreditNoteId = (invoice: Invoice): string =>
  invoice.invoice_number.replace(/^FAC-/, "NC-");

// TODO: El backend no tiene modelo de nota de crédito; el monto negativo es
// inventado mientras no exista la API real.
export const formatInvoiceCreditNoteAmount = (
  value: number | null | undefined
): string => {
  const formatted = formatApiAmount(value ? Math.abs(value) : value);
  return formatted ? `CLP -$${formatted}` : DISPLAY_FALLBACK;
};

// TODO: El backend no tiene modelo de nota de crédito; el desglose del ajuste
// es inventado (IVA 19%) mientras no exista la API real.
export const getCreditNoteBreakdown = (total: number | null | undefined) => {
  if (!total) return null;
  const abs = Math.abs(total);
  const subtotal = Math.round(abs / 1.19);
  const iva = abs - subtotal;
  return { subtotal: -subtotal, iva: -iva, total: -abs };
};
