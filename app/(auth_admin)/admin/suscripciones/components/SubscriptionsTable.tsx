import clsx from "clsx";
import ServerTableWrapper from "../../components/shared/table/ServerTableWrapper";
import { Subscription } from "@/types/admin";
import SubscriptionRowAction from "./detail/SubscriptionRowAction";
import {
  DISPLAY_FALLBACK,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_STYLES,
  formatPaymentMethod,
  formatSubscriptionDate,
  getBillingPeriodLabel,
  getClientTypeLabel,
  getMrrDisplay,
} from "../utils/subscriptionDisplay";

type SubscriptionsTableProps = {
  params: { [key: string]: string };
};

const PAGE_SIZE = 10;

const headers = [
  "ID Suscripción",
  "Cliente",
  "Plan",
  "Ciclo",
  "MRR",
  "Fecha contrato",
  "Fecha renovación",
  "Método de cobro",
  "Estado",
  "Acciones",
];

// TODO:
// 1. Ajustar todos los campos que puedan ser null o undefined para que muestren un valor por defecto, como "N/A"
// 2. Verificar si es correcto que suscripciones sin cobro muestren MRR o ciclo
const RowContent = (sub: Subscription) => (
  <>
    <td className="text-neutral-secondary">{sub.subscription_id}</td>
    <td className="text-neutral-secondary">
      {sub.client_name || DISPLAY_FALLBACK}
      <span className="block text-sm text-neutral-tertiary">
        {getClientTypeLabel(sub.client_type)}
      </span>
    </td>
    <td className="text-neutral-secondary">{sub.pack_name_snapshot}</td>
    <td className="text-neutral-secondary">
      {getBillingPeriodLabel(sub.billing_period)}
    </td>
    <td className="text-right text-neutral-secondary">
      {getMrrDisplay(sub.mrr_clp)}
    </td>
    <td className="text-neutral-secondary">
      {formatSubscriptionDate(sub.created)}
    </td>
    <td className="text-neutral-secondary">
      {formatSubscriptionDate(sub.next_billing_at)}
    </td>
    <td className="text-neutral-secondary">
      {formatPaymentMethod(sub)}
    </td>
    <td>
      <span
        className={clsx(
          "inline-block rounded-lg px-2 py-0.75 text-xs font-medium",
          SUBSCRIPTION_STATUS_STYLES[sub.status]
        )}
      >
        {SUBSCRIPTION_STATUS_LABELS[sub.status]}
      </span>
    </td>
    <td>
      <SubscriptionRowAction subscription={sub} />
    </td>
  </>
);

const SubscriptionsTable = ({ params }: SubscriptionsTableProps) => {
  return (
    <ServerTableWrapper<Subscription>
      headers={headers}
      row={RowContent}
      endpoint="/admin-overview/subscriptions"
      params={params}
      pageSize={PAGE_SIZE}
      serverTag={["admin-subscriptions"]}
      noDataMessage="No se encontraron suscripciones"
      stickyRightColumns={2}
    />
  );
};

export default SubscriptionsTable;
