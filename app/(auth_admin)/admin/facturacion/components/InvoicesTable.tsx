import ServerTableWrapper from "../../components/shared/table/ServerTableWrapper";
import { Invoice } from "@/types/admin";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import InvoiceRowAction from "./detail/InvoiceRowAction";
import {
  DISPLAY_FALLBACK,
  formatInvoiceAmount,
  formatInvoiceDate,
  formatInvoicePaymentMethod,
  formatRut,
} from "../utils/invoiceDisplay";

type InvoicesTableProps = {
  params: { [key: string]: string };
};

const PAGE_SIZE = 10;

const headers = [
  "Factura",
  "Fecha emisión",
  "Cliente",
  "ID Suscripción",
  "Monto",
  "Método de pago",
  "Fecha vencimiento",
  "Estado",
  "Acciones",
];

const RowContent = (invoice: Invoice) => (
  <>
    <td className="text-neutral-secondary">{invoice.invoice_number}</td>
    <td className="text-neutral-secondary">{formatInvoiceDate(invoice.issued_at)}</td>
    <td className="text-neutral-secondary">
      {invoice.company_name_snapshot || DISPLAY_FALLBACK}
      <span className="block text-sm text-neutral-tertiary">
        {formatRut(invoice.company_rut_snapshot)}
      </span>
    </td>
    <td className="text-neutral-secondary">{invoice.subscription_id}</td>
    <td className="text-neutral-secondary">{formatInvoiceAmount(invoice.total_amount_clp)}</td>
    <td className="text-neutral-secondary">{formatInvoicePaymentMethod(invoice)}</td>
    <td className="text-neutral-secondary">{formatInvoiceDate(invoice.due_date)}</td>
    <td>
      <InvoiceStatusBadge invoice={invoice} />
    </td>
    <td>
      <InvoiceRowAction invoice={invoice} />
    </td>
  </>
);

const InvoicesTable = ({ params }: InvoicesTableProps) => {
  return (
    <ServerTableWrapper<Invoice>
      headers={headers}
      row={RowContent}
      endpoint="/admin-overview/invoices/"
      params={params}
      pageSize={PAGE_SIZE}
      fetchCache="no-store"
      noDataMessage="No se encontraron facturas"
      stickyLastColumns={2}
    />
  );
};

export default InvoicesTable;
