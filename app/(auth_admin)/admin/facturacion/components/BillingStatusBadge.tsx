import clsx from "clsx";
import { Subscription } from "@/types/admin";
import {
  BILLING_STATUS_LABELS,
  BILLING_STATUS_STYLES,
  getBillingStatus,
} from "../utils/billingDisplay";

type BillingStatusBadgeProps = {
  subscription: Subscription;
};

const BillingStatusBadge = ({ subscription }: BillingStatusBadgeProps) => {
  const status = getBillingStatus(subscription);

  return (
    <span
      className={clsx(
        "inline-block rounded-lg px-2 py-0.75 text-xs font-medium",
        BILLING_STATUS_STYLES[status]
      )}
    >
      {BILLING_STATUS_LABELS[status]}
    </span>
  );
};

export default BillingStatusBadge;
