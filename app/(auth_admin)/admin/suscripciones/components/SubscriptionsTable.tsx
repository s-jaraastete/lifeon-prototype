import clsx from "clsx";
import ServerTableWrapper from "./table/ServerTableWrapper";
import { Subscription, SubscriptionStatus } from "@/types/admin";
import { formatReferenceAmount } from "@/utils/pricingHelpers";
import SubscriptionRowAction from "./detail/SubscriptionRowAction";

type SubscriptionsTableProps = {
  params: { [key: string]: string };
};

const PAGE_SIZE = 5;

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

const statusStyles: Record<SubscriptionStatus, string> = {
  pending_payment_method: "bg-yellow-100 text-yellow-800",
  pending_initial_payment: "bg-yellow-100 text-yellow-800",
  trialing: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  past_due: "bg-red-100 text-red-800",
  suspended: "bg-orange-100 text-orange-800",
  cancelled: "bg-gray-100 text-gray-800",
  expired: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<SubscriptionStatus, string> = {
  pending_payment_method: /* "Pendiente método de pago" */ "Pendiente",
  pending_initial_payment: "Pendiente de pago inicial",
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pendiente",
  suspended: "Suspendida",
  cancelled: "Cancelada",
  expired: "Expirada",
  // plan_free: "Plan free",
};

const formatDate = (date: string | null) =>
  date ? new Date(date).toISOString().split("T")[0] : "—";

const RowContent = (sub: Subscription) => (
  <>
    <td className="font-medium text-neutral-primary">{sub.subscription_id}</td>
    <td className="text-neutral-primary">{sub.client_name}</td>
    <td className="text-neutral-primary">{sub.pack_name_snapshot}</td>
    <td className="text-neutral-primary">
      {sub.billing_period === "monthly" ? "Mensual" : "Anual"}
    </td>
    <td className="text-right font-medium text-neutral-primary">
      ${formatReferenceAmount(sub.mrr_clp)}
    </td>
    <td className="text-neutral-secondary">{formatDate(sub.created)}</td>
    <td className="text-neutral-secondary">
      {formatDate(sub.next_billing_at)}
    </td>
    <td className="text-neutral-secondary">{sub.card_type || "Sin cobro"}</td>
    <td>
      <span
        className={clsx(
          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
          statusStyles[sub.status]
        )}
      >
        {statusLabels[sub.status]}
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
      noDataMessage="No se encontraron suscripciones"
    />
  );
};

export default SubscriptionsTable;
