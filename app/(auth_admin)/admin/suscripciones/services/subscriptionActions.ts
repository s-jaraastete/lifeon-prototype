"use server";

import { updateTag } from "next/cache";
import { getServerData, postServerData } from "@/lib/requests";

const SUBSCRIPTIONS_TABLE_TAG = "admin-subscriptions";

type PlanPrice = {
  amount: string;
  currency: string;
  billing_period: "monthly" | "yearly";
};

type AvailablePlan = {
  public_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  prices: PlanPrice[];
};

export type SubscriptionPlanChangeOptions = {
  subscription: {
    public_id: string;
    status: string;
    company_name: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  };
  current_plan: {
    public_id: string;
    name: string;
    billing_period: "monthly" | "yearly";
    price_uf_snapshot: string;
    currency_snapshot: string;
  };
  available_plans: AvailablePlan[];
  pending_plan_change: {
    status: "pending";
    target_pack_public_id: string;
    target_pack_name: string;
    target_billing_period: "monthly" | "yearly";
    target_price_uf_snapshot: string;
    target_currency_snapshot: string;
    is_locked_by_payment: boolean;
  } | null;
  can_schedule_plan_change: boolean;
};

export const refreshSubscriptionsTable = async () => {
  updateTag(SUBSCRIPTIONS_TABLE_TAG);
};

const executeSubscriptionAction = async (
  action: "suspend" | "reactivate" | "cancel" | "archive" | "payment-reminder" | "retry-payment" | "plan-change",
  subscriptionPublicId: string,
  payload: Record<string, unknown> = {},
) => {
  await postServerData(
    `/subscriptions/${subscriptionPublicId}/actions/${action}/`,
    payload,
    {
      useAccessToken: true,
      cache: "no-store",
    },
  );

  updateTag(SUBSCRIPTIONS_TABLE_TAG);
};

export const suspendSubscription = async (
  subscriptionPublicId: string,
  reason: string,
) => {
  await executeSubscriptionAction("suspend", subscriptionPublicId, { reason });
};

export const reactivateSubscription = async (
  subscriptionPublicId: string,
  reason: string,
) => {
  await executeSubscriptionAction("reactivate", subscriptionPublicId, { reason });
};

export const cancelSubscription = async (
  subscriptionPublicId: string,
  reason: string,
) => {
  await executeSubscriptionAction("cancel", subscriptionPublicId, { reason });
};

export const archiveSubscription = async (
  subscriptionPublicId: string,
  reason: string,
) => {
  await executeSubscriptionAction("archive", subscriptionPublicId, { reason });
};

export const sendPaymentReminder = async (
  subscriptionPublicId: string,
) => {
  await executeSubscriptionAction("payment-reminder", subscriptionPublicId);
};

export const retrySubscriptionPayment = async (
  subscriptionPublicId: string,
) => {
  await executeSubscriptionAction("retry-payment", subscriptionPublicId);
};

export const getSubscriptionPlanChangeOptions = async (
  subscriptionPublicId: string,
) => {
  const response = await getServerData(
    `/subscriptions/${subscriptionPublicId}/actions/plan-change/`,
    {
      useAccessToken: true,
      cache: "no-store",
    },
  );

  return response.data as SubscriptionPlanChangeOptions;
};

export const scheduleSubscriptionPlanChange = async (
  subscriptionPublicId: string,
  targetPackPublicId: string,
  targetBillingPeriod: "monthly" | "yearly",
) => {
  await executeSubscriptionAction("plan-change", subscriptionPublicId, {
    target_pack_public_id: targetPackPublicId,
    target_billing_period: targetBillingPeriod,
  });
};
