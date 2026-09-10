export type PaginatedResponse<T> = {
  count: number;
  next: number | null;
  previous: number | null;
  results: T[];
};

export type SubscriptionStatus =
  | "pending_payment_method"
  | "pending_initial_payment"
  | "trialing"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled"
  | "expired";

export type SubscriptionAction =
  | "suspend"
  | "plan_change"
  | "retry_payment"
  | "payment_reminder"
  | "reactivate"
  | "cancel"
  | "revoke_cancellation"
  | "archive";

export type PlanItem = {
  display_name: string;
};

export type PendingPlanChange = {
  target_pack_name: string;
  target_billing_period: "monthly" | "yearly";
  is_locked_by_payment: boolean;
};

export type Subscription = {
  public_id: string;
  subscription_id: string;
  client_name: string;
  client_type: string | null;
  pack_name_snapshot: string;
  billing_period: "monthly" | "yearly";
  mrr_clp: number;
  mrr_uf: number;
  billing_email: string | null;
  plan_items: PlanItem[];
  created: string;
  current_period_end: string | null;
  next_billing_at: string | null;
  payment_method: string | null;
  card_type: string | null;
  card_last_four: string | null;
  status: SubscriptionStatus;
  pending_plan_change: PendingPlanChange | null;
  cancel_at_period_end: boolean;
  available_actions: SubscriptionAction[];
};
