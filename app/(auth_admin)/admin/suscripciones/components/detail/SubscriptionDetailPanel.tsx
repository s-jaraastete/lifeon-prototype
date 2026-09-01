"use client";

import {
  LuBadgeCheck,
  LuBan,
  LuBox,
  LuEllipsis,
  LuRocket,
} from "react-icons/lu";
import Image from "next/image";
import clsx from "clsx";
import SlideOver from "@/app/components/ui/SlideOver";
import { Subscription, SubscriptionStatus } from "@/types/admin";
import { formatDateShort } from "@/utils/formatDate";
import { formatApiAmount } from "@/utils/pricingHelpers";

type SubscriptionDetailPanelProps = {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
};

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

// TODO: Actualizar labels de status
const statusLabels: Record<SubscriptionStatus, string> = {
  pending_payment_method: "Pendiente",
  pending_initial_payment: "Pendiente",
  trialing: "En prueba",
  active: "Activo",
  past_due: "Pago pendiente",
  suspended: "Suspendida",
  cancelled: "Cancelada",
  expired: "Expirada",
};

const clientType = (value: string | null) =>
 value === "individual" ? "Individual" : "Organización";

const billingPeriodLabel = (period: Subscription["billing_period"]) =>
  period === "monthly" ? "Mensual" : "Anual";

const paymentMethod = (value: string | null) => {
  if (!value) return "N/A";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatPaymentDetail = (
  cardType: string | null,
  cardLastFour: string | null
) => {
  if (!cardType || !cardLastFour) return "N/A";
  return `Tarjeta ${cardType} •••• ${cardLastFour}`;
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-neutral-secondary">{label}</span>
    <span className="text-sm text-neutral-primary">{value}</span>
  </div>
);

const PanelTitle = (
  <div className="flex items-center gap-2.5">
    <LuBadgeCheck className="h-4.5 w-4.5 text-secondary" />
    Detalles de la suscripción
  </div>
);

export default function SubscriptionDetailPanel({
  open,
  subscription,
  onClose,
}: SubscriptionDetailPanelProps) {
  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={PanelTitle}
      size="w-150"
    >
      {subscription && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 pt-2 text-center">
            <div className="relative h-19 w-19 overflow-hidden">
              <Image
                src="/svg/avatar.svg"
                alt="Avatar"
                fill
                className="object-cover"
                priority={false}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <h2 className="text-2xl font-semibold text-neutral-primary">
                  {subscription.client_name}
                </h2>
                <span
                  className={clsx(
                    "inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium",
                    statusStyles[subscription.status]
                  )}
                >
                  {statusLabels[subscription.status]}
                </span>
              </div>

              <p className="text-sm text-neutral-secondary">
                ID Suscripción: {subscription.subscription_id}
              </p>
              <p className="text-sm text-neutral-secondary">
                {clientType(subscription.client_type)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5"
            >
              <LuRocket className="mr-2 inline-block h-4.5 w-4.5" />
              Cambiar plan
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LuBan className="mr-2 inline-block h-4.5 w-4.5" />
              Suspender suscripción
            </button>
            <button
              type="button"
              className="rounded-lg border border-stroke-primary p-2 text-neutral-secondary transition-colors hover:bg-surface-tertiary hover:text-secondary"
              aria-label="Más acciones"
            >
              <LuEllipsis className="h-5 w-5" />
            </button>
          </div>

          <section className="rounded-xl border border-stroke bg-white p-5">
            <h3 className="text-lg font-semibold text-neutral-primary">
              Plan y facturación
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DetailRow
                label="Plan"
                value={`${subscription.pack_name_snapshot} / ${clientType(subscription.client_type)}`}
              />
              <DetailRow
                label="Ciclo"
                value={billingPeriodLabel(subscription.billing_period)}
              />
              <DetailRow
                label="Renovación"
                value={formatDateShort(subscription.next_billing_at ?? "")}
              />
              <DetailRow
                label="MRR"
                value={`$${formatApiAmount(subscription.mrr_clp)} CLP /mes`}
              />
            </div>
          </section>

          {subscription.plan_items.length > 0 && (
            <section className="rounded-xl border border-stroke bg-white p-5">
              <h3 className="text-lg font-semibold text-neutral-primary">
                Add-ons contratados
              </h3>

              <ul className="mt-5 flex flex-col gap-4">
                {subscription.plan_items.map((item, idx) => (
                  <li
                    key={`${item.display_name}-${idx}`}
                    className="flex items-center justify-between text-sm text-neutral-primary"
                  >
                    <div className="flex items-center gap-3">
                      <LuBox className="h-4 w-4 text-secondary" />
                      <span>{item.display_name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-stroke bg-white p-5">
            <h3 className="text-lg font-semibold text-neutral-primary">
              Método de pago
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DetailRow
                label="Modalidad"
                value={paymentMethod(subscription.payment_method)}
              />
              <DetailRow
                label="Detalle"
                value={formatPaymentDetail(
                  subscription.card_type,
                  subscription.card_last_four
                )}
              />
              <DetailRow
                label="Correo DTE"
                value={subscription.billing_email ?? "—"}
              />
            </div>
          </section>
        </div>
      )}
    </SlideOver>
  );
}
