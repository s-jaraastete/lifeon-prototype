import clsx from "clsx";
import ServerTableWrapper from "../../components/shared/table/ServerTableWrapper";
import { Subscription } from "@/types/admin";
import SubscriptionRowAction from "./detail/SubscriptionRowAction";
import SubscriptionStatusBadge from "./SubscriptionStatusBadge";
import {
  DISPLAY_FALLBACK,
  formatPaymentMethod,
  formatSubscriptionDate,
  getBillingPeriodLabel,
  getClientTypeLabel,
  getMrrDisplay,
} from "../utils/subscriptionDisplay";
import { LuInfo } from "react-icons/lu";

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

type InfoTooltipProps = {
  message: string;
  position?: "center" | "end";
  singleLine?: boolean;
};

const InfoTooltip = ({
  message,
  position = "center",
  singleLine = false,
}: InfoTooltipProps) => (
  <div className="group relative inline-flex rounded-lg bg-info-subtle px-2 py-1 text-xs font-medium text-info">
    <LuInfo aria-hidden="true" />
    <span
      role="tooltip"
      className={clsx(
        "pointer-events-none absolute bottom-full z-20 mb-2 w-max rounded-lg bg-gray-300 px-3 py-2 text-center text-xs leading-5 text-neutral-primary opacity-0 transition-opacity duration-150 group-hover:delay-500 group-hover:opacity-100 after:absolute after:top-full after:border-x-[6px] after:border-x-transparent after:border-t-[6px] after:border-t-gray-300",
        singleLine ? "whitespace-nowrap" : "max-w-50 whitespace-normal",
        position === "end"
          ? "right-0 after:right-2"
          : "left-1/2 -translate-x-1/2 after:left-1/2 after:-translate-x-1/2",
      )}
    >
      {message}
    </span>
  </div>
);

// TODO:
// 1. Ajustar todos los campos que puedan ser null o undefined para que muestren un valor por defecto, como "N/A"
// 2. Verificar si es correcto que suscripciones sin cobro muestren MRR o ciclo
const RowContent = (sub: Subscription) => (
  <>
    <td className="text-neutral-secondary">
      <div className="flex items-center gap-2">
        <span>{sub.subscription_id}</span>
      </div>
    </td>
    <td className="text-neutral-secondary">
      {sub.client_name || DISPLAY_FALLBACK}
      <span className="block text-sm text-neutral-tertiary">
        {getClientTypeLabel(sub.client_type)}
      </span>
    </td>
    <td>
      <div className="flex items-center">
        <p className="text-neutral-secondary">{sub.pack_name_snapshot}</p>
        {sub.pending_plan_change && (
          <div className="ml-2">
            <InfoTooltip
              message={`Cambio programado: ${sub.pending_plan_change.target_pack_name} ${getBillingPeriodLabel(sub.pending_plan_change.target_billing_period).toLowerCase()} - ${formatSubscriptionDate(sub.next_billing_at)}`}
              singleLine
            />
          </div>
        )}
      </div>
    </td>
    <td className="text-neutral-secondary">
      {getBillingPeriodLabel(sub.billing_period)}
    </td>
    <td className="text-neutral-secondary">
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
      <div className="flex items-start gap-2">
        <SubscriptionStatusBadge subscription={sub} />
        {sub.cancel_at_period_end && (
          <InfoTooltip
            message={`Cancelación programada: el acceso finalizará el ${formatSubscriptionDate(sub.current_period_end)}.`}
            position="end"
          />
        )}
      </div>
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
      fetchCache="no-store"
      noDataMessage="No se encontraron suscripciones"
      stickyLastColumns={2}
    />
  );
};

export default SubscriptionsTable;
