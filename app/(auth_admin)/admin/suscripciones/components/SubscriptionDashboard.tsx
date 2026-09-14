import { SubscriptionDashboardOverview } from "@/types/admin";
import { formatReferenceAmount } from "@/utils/pricingHelpers";
import DashboardSection from "../../components/shared/DashboardSection";
import type { StatTone } from "../../components/shared/StatCard";
import OverdueStatusButton from "./filters/OverdueStatusButton";

type SubscriptionDashboardProps = {
  data: SubscriptionDashboardOverview;
};

const formatDecimal = (value: number): string =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(value);

const signedPercentage = (change: number): string =>
  `${change > 0 ? "+" : ""}${formatDecimal(change)}%`;

const snapshotTone = (change: number | undefined): StatTone =>
  change == null ? "default" : change < 0 ? "danger" : change > 0 ? "success" : "default";

const churnTone = (change: number | undefined): StatTone =>
  change == null ? "default" : change > 0 ? "danger" : change < 0 ? "success" : "default";

const snapshotNote = (change: number | undefined): string =>
  change == null ? "" : `${signedPercentage(change)} vs mes anterior`;

const toCards = (data: SubscriptionDashboardOverview) => {
  const active = data.active_subscriptions;
  const mrr = data.monthly_mrr;
  const overdue = data.overdue_subscriptions;
  const churn = data.churn_rate;

  return [
    {
      label: "Suscripciones activas",
      value: formatDecimal(active.value),
      note: snapshotNote(active.change_percentage),
      tone: snapshotTone(active.change_percentage),
    },
    {
      label: "MRR total mensual",
      value: `$${formatReferenceAmount(mrr.value)}`,
      note: snapshotNote(mrr.change_percentage),
      tone: snapshotTone(mrr.change_percentage),
    },
    {
      label: "Suscripciones vencidas",
      value: formatDecimal(overdue.value),
      note: <OverdueStatusButton />,
      tone: "default" as const,
    },
    {
      label: "Tasa de abandono",
      value: `${formatDecimal(churn.value)}%`,
      note: snapshotNote(churn.change_percentage),
      tone: churnTone(churn.change_percentage),
    },
  ];
};

const SubscriptionDashboard = ({ data }: SubscriptionDashboardProps) => (
  <DashboardSection
    title="Suscripciones"
    description={
      <>
        Gestiona y controla los contratos de suscripción de usuarios y <br />
        organizaciones en LifeOn.
      </>
    }
    cards={toCards(data)}
  />
);

export default SubscriptionDashboard;
