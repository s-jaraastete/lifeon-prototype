"use client";

import {
  LuBadgeCheck,
  LuBan,
  LuEllipsis,
  LuRocket,
  LuBox,
} from "react-icons/lu";
import Image from "next/image";
import clsx from "clsx";
import { Subscription } from "@/types/admin";
import { AprIcon, DocumentacionIcon, MiperIcon } from "@/app/components/shared/baseModules";
import DetailPanel, {
  DetailActions,
  DetailSectionList,
  type DetailSectionConfig,
} from "@/app/(auth_admin)/admin/components/shared/detail/DetailPanel";
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

const PanelTitle = (
  <div className="flex items-center gap-2.5">
    <LuBadgeCheck className="h-4.5 w-4.5 text-secondary" />
    Detalles de la suscripción
  </div>
);

const getModuleIcon = (displayName: string): React.ReactNode => {
  switch (displayName) {
    case "Matriz IPER":
      return <MiperIcon box="size-5" iconSize={12} />;

    case "Programa y Documentación Preventiva":
      return <DocumentacionIcon box="size-5" iconSize={12} />;

    case "APR Virtual":
      return <AprIcon box="size-5" iconSize={10} />;

    default:
      return <LuBox className="h-4 w-4 text-secondary mx-0.5" />;
  }
};


export default function SubscriptionDetailPanel({
  open,
  subscription,
  onClose,
}: SubscriptionDetailPanelProps) {
  if (!subscription) {
    return <DetailPanel open={open} onClose={onClose} title={PanelTitle} />;
  }

  const addOnsSection: DetailSectionConfig = {
    title: "Add-ons contratados",
    gridClassName: "mt-5",
    content: (
      <ul className="flex flex-col gap-4">
        {subscription.plan_items.map((item, idx) => (
          <li
            key={`${item.display_name}-${idx}`}
            className="flex items-center justify-between text-sm text-neutral-primary"
          >
            <div className="flex items-center gap-3">
              {getModuleIcon(item.display_name)}
              <span>{item.display_name}</span>
            </div>
          </li>
        ))}
      </ul>
    ),
  };

  const sections: DetailSectionConfig[] = [
    {
      title: "Plan y facturación",
      rows: [
        {
          label: "Plan",
          value: getPlanWithClientTypeLabel(
            subscription.pack_name_snapshot,
            subscription.client_type
          ),
        },
        {
          label: "Ciclo",
          value: getBillingPeriodLabel(subscription.billing_period),
        },
        {
          label: "Renovación",
          value: formatSubscriptionDate(subscription.next_billing_at),
        },
        {
          label: "MRR",
          value: (() => {
            const v = getMrrDisplay(subscription.mrr_clp);
            return v === DISPLAY_FALLBACK ? v : `${v} /mes`;
          })(),
        },
      ],
    },
    ...(subscription.plan_items.length > 0 ? [addOnsSection] : []),
    {
      title: "Método de pago",
      rows: [
        {
          label: "Modalidad",
          value: getPaymentMethodLabel(subscription.payment_method),
        },
        {
          label: "Detalle",
          value: formatPaymentDetail(
            subscription.card_type,
            subscription.card_last_four
          ),
        },
        {
          label: "Correo DTE",
          value: subscription.billing_email || DISPLAY_FALLBACK,
        },
      ],
    },
  ];

  return (
    <DetailPanel open={open} onClose={onClose} title={PanelTitle}>
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

      <DetailActions>
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
      </DetailActions>

      <DetailSectionList sections={sections} />
    </DetailPanel>
  );
}
