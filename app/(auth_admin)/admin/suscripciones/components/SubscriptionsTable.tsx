import clsx from "clsx";
import ServerTableWrapper from "./table/ServerTableWrapper";
import { Subscription, SubscriptionStatus } from "@/types/admin";
import { formatDateShort } from "@/utils/formatDate";
import { formatApiAmount } from "@/utils/pricingHelpers";
import SubscriptionRowAction from "./detail/SubscriptionRowAction";

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

const statusStyles: Record<SubscriptionStatus, string> = {
  pending_payment_method: "bg-yellow-100 text-yellow-600",
  pending_initial_payment: "bg-yellow-100 text-yellow-600",
  trialing: "bg-lavender-100 text-lavender-700",
  active: "bg-green-100 text-green-700",
  past_due: "bg-yellow-100 text-yellow-600",
  suspended: "bg-orange-100 text-orange-600",
  cancelled: "bg-red-error-100 text-red-error-700",
  expired: "bg-red-error-100 text-red-error-700",
};

// TODO: Revisar labels con respecto a multiples status pendientes de pago
const statusLabels: Record<SubscriptionStatus, string> = {
  pending_payment_method: /* "Pendiente método de pago" */ "Pendiente",
  pending_initial_payment: "Pendiente de pago inicial",
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pendiente",
  suspended: "Suspendida",
  cancelled: "Cancelada",
  expired: "Vencida",
  // plan_free: "Plan free",
};

const clientType = (value: string | null) =>
 value === "individual" ? "Individual" : "Organización";

const formatValue = <T, R>(
  value: T | null | undefined,
  formatter?: (val: T) => R,
  fallback = 'N/A'
) => {
  if (!value) return fallback;
  return formatter ? formatter(value) : value;
};

// TODO:
// 1. Ajustar todos los campos que puedan ser null o undefined para que muestren un valor por defecto, como "N/A"
// 2. Verificar si es correcto que suscripciones sin cobro muestren MRR o ciclo
const RowContent = (sub: Subscription) => (
  <>
    <td className="text-neutral-secondary">{sub.subscription_id}</td>
    <td className="text-neutral-secondary">
      {sub.client_name}
      <span className="block text-sm text-neutral-tertiary">
        {clientType(sub.client_type)}
      </span>
    </td>
    <td className="text-neutral-secondary">{sub.pack_name_snapshot}</td>
    <td className="text-neutral-secondary">
      {sub.billing_period === "monthly" ? "Mensual" : "Anual"}
    </td>
    <td className="text-right text-neutral-secondary">
      CLP ${formatApiAmount(sub.mrr_clp)}
    </td>
    <td className="text-neutral-secondary">
      {formatValue(sub.created, formatDateShort)}
    </td>
    <td className="text-neutral-secondary">
      {formatValue(sub.next_billing_at, formatDateShort)}
    </td>
    <td className="text-neutral-secondary">{sub.card_type || "Sin cobro"}</td>
    <td>
      <span
        className={clsx(
          "inline-block rounded-lg px-2 py-0.75 text-xs font-medium",
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
