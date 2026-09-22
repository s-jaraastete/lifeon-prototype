import clsx from "clsx";
import { Invoice } from "@/types/admin";
import {
  INVOICE_STATUS_DISPLAY_LABELS,
  INVOICE_STATUS_DISPLAY_STYLES,
  getInvoiceDisplayStatus,
} from "../utils/invoiceDisplay";

type InvoiceStatusBadgeProps = {
  invoice: Invoice;
};

const InvoiceStatusBadge = ({ invoice }: InvoiceStatusBadgeProps) => {
  const status = getInvoiceDisplayStatus(invoice);

  return (
    <span
      className={clsx(
        "inline-block rounded-lg px-2 py-0.75 text-xs font-medium",
        INVOICE_STATUS_DISPLAY_STYLES[status]
      )}
    >
      {INVOICE_STATUS_DISPLAY_LABELS[status]}
    </span>
  );
};

export default InvoiceStatusBadge;
