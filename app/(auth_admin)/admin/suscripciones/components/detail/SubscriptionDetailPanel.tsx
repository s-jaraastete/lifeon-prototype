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
import { Subscription } from "@/types/admin";
import {
  DISPLAY_FALLBACK,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_STYLES,
  formatPaymentDetail,
  formatSubscriptionDate,
  getBillingPeriodLabel,
  getClientTypeLabel,
  getMrrDisplay,
  getPaymentMethodLabel,
  getPlanWithClientTypeLabel,
} from "../../utils/subscriptionDisplay";

type SubscriptionDetailPanelProps = {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
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
                    SUBSCRIPTION_STATUS_STYLES[subscription.status]
                  )}
                >
                  {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                </span>
              </div>

              <p className="text-sm text-neutral-secondary">
                ID Suscripción: {subscription.subscription_id}
              </p>
              <p className="text-sm text-neutral-secondary">
                {getClientTypeLabel(subscription.client_type)}
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
                value={getPlanWithClientTypeLabel(
                  subscription.pack_name_snapshot,
                  subscription.client_type
                )}
              />
              <DetailRow
                label="Ciclo"
                value={getBillingPeriodLabel(subscription.billing_period)}
              />
              <DetailRow
                label="Renovación"
                value={formatSubscriptionDate(subscription.next_billing_at)}
              />
              <DetailRow
                label="MRR"
                value={(() => {
                  const v = getMrrDisplay(subscription.mrr_clp);
                  return v === DISPLAY_FALLBACK ? v : `${v} /mes`;
                })()}
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
                value={getPaymentMethodLabel(subscription.payment_method)}
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
                value={subscription.billing_email || DISPLAY_FALLBACK}
              />
            </div>
          </section>
        </div>
      )}
    </SlideOver>
  );
}
