"use client";

import clsx from "clsx";
import { LuLoaderCircle } from "react-icons/lu";
import { Subscription } from "@/types/admin";
import {
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_STYLES,
} from "../utils/subscriptionDisplay";
import { useSubscriptionPaymentRetry } from "./SubscriptionPaymentRetryProvider";

type SubscriptionStatusBadgeProps = {
  subscription: Subscription;
};

const SubscriptionStatusBadge = ({
  subscription,
}: SubscriptionStatusBadgeProps) => {
  const { isPaymentRetryProcessing } = useSubscriptionPaymentRetry();
  const isProcessingPaymentRetry = isPaymentRetryProcessing(
    subscription.public_id,
  );

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={clsx(
          "inline-block rounded-lg px-2 py-0.75 text-xs font-medium",
          SUBSCRIPTION_STATUS_STYLES[subscription.status],
        )}
      >
        {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
      </span>
      {isProcessingPaymentRetry && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-info">
          <LuLoaderCircle className="animate-spin" size={14} />
          Procesando cobro
        </span>
      )}
    </div>
  );
};

export default SubscriptionStatusBadge;
