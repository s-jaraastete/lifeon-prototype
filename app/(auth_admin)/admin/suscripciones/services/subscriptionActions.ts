"use server";

import { refresh } from "next/cache";
import { getServerData, postServerData } from "@/lib/requests";

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
    renewal_payment_status: "pending" | "processing" | "paid" | "failed" | "requires_review" | null;
  } | null;
  can_schedule_plan_change: boolean;
  plan_change_unavailable_reason: string | null;
};

export type SubscriptionPaymentRetryRequest = {
  subscription_public_id: string;
  queued: true;
  previous_payment_attempt_id: number | null;
  message: string;
};

export type SubscriptionPaymentRetryStatus = {
  subscription_public_id: string;
  subscription_status: string;
  retry_status: "waiting" | "processing" | "approved" | "rejected" | "error" | "requires_review";
  payment_status: "pending" | "processing" | "paid" | "failed" | "requires_review" | "cancelled" | null;
  payment_attempt_id: number | null;
  payment_attempt_status: "created" | "processing" | "approved" | "rejected" | "error" | null;
};

export const refreshSubscriptionsTable = async () => {
  refresh();
};

const executeSubscriptionAction = async (
  action: "suspend" | "reactivate" | "cancel" | "cancel/revoke" | "archive" | "payment-reminder" | "plan-change",
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

  refresh();
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
  const response = await postServerData(
    `/subscriptions/${subscriptionPublicId}/actions/retry-payment/`,
    {},
    {
      useAccessToken: true,
      cache: "no-store",
    },
  );

  return response.data as SubscriptionPaymentRetryRequest;
};

export const getSubscriptionPaymentRetryStatus = async (
  subscriptionPublicId: string,
  previousPaymentAttemptId: number | null,
) => {
  const params = new URLSearchParams();

  if (previousPaymentAttemptId !== null) {
    params.set(
      "previous_payment_attempt_id",
      previousPaymentAttemptId.toString(),
    );
  }

  const response = await getServerData(
    `/subscriptions/${subscriptionPublicId}/actions/retry-payment/status/?${params.toString()}`,
    {
      useAccessToken: true,
      cache: "no-store",
    },
  );

  return response.data as SubscriptionPaymentRetryStatus;
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

export const revokeScheduledSubscriptionCancellation = async (
  subscriptionPublicId: string,
  reason: string,
) => {
  await executeSubscriptionAction("cancel/revoke", subscriptionPublicId, { reason });
};

export const cancelScheduledSubscriptionPlanChange = async (
  subscriptionPublicId: string,
) => {
  await postServerData(
    `/subscriptions/${subscriptionPublicId}/actions/plan-change/cancel/`,
    {},
    {
      useAccessToken: true,
      cache: "no-store",
    },
  );

  refresh();
};
