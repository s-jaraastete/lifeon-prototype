import ServerTableWrapper from "../../components/shared/table/ServerTableWrapper";
import { Subscription } from "@/types/admin";
import BillingStatusBadge from "./BillingStatusBadge";
import BillingRowAction from "./detail/BillingRowAction";
import {
  DISPLAY_FALLBACK,
  formatBillingAmount,
  formatBillingDate,
  formatBillingPaymentMethod,
  getClientTypeLabel,
  getBillingId,
} from "../utils/billingDisplay";

type BillingTableProps = {
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

const RowContent = (sub: Subscription) => (
  <>
    <td className="text-neutral-secondary">{getBillingId(sub)}</td>
    <td className="text-neutral-secondary">{formatBillingDate(sub.created)}</td>
    {/* TODO: El endpoint de suscripciones no expone RUT; se muestra el tipo de cliente. */}
    <td className="text-neutral-secondary">
      {sub.client_name || DISPLAY_FALLBACK}
      <span className="block text-sm text-neutral-tertiary">
        {getClientTypeLabel(sub.client_type)}
      </span>
    </td>
    <td className="text-neutral-secondary">{sub.subscription_id}</td>
    <td className="text-neutral-secondary">{formatBillingAmount(sub.mrr_clp)}</td>
    <td className="text-neutral-secondary">{formatBillingPaymentMethod(sub)}</td>
    {/* TODO: Se usa next_billing_at como vencimiento mientras no exista el endpoint de facturación. */}
    <td className="text-neutral-secondary">{formatBillingDate(sub.next_billing_at)}</td>
    <td>
      <BillingStatusBadge subscription={sub} />
    </td>
    <td>
      <BillingRowAction subscription={sub} />
    </td>
  </>
);

const BillingTable = ({ params }: BillingTableProps) => {
  return (
    <ServerTableWrapper<Subscription>
      headers={headers}
      row={RowContent}
      // TODO: Usar el endpoint de facturación cuando exista.
      endpoint="/admin-overview/subscriptions"
      params={params}
      pageSize={PAGE_SIZE}
      fetchCache="no-store"
      noDataMessage="No se encontraron facturas"
      stickyLastColumns={2}
    />
  );
};

export default BillingTable;
