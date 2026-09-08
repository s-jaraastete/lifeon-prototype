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
  | "archive";

export type PlanItem = {
  display_name: string;
};

export type SubscriptionMetric = {
  value: number;
  change_percentage?: number;
};

export type SubscriptionDashboardOverview = {
  active_subscriptions: SubscriptionMetric;
  monthly_mrr: SubscriptionMetric;
  overdue_subscriptions: { value: number };
  churn_rate: SubscriptionMetric;
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
  next_billing_at: string | null;
  payment_method: string | null;
  card_type: string | null;
  card_last_four: string | null;
  status: SubscriptionStatus;
  available_actions: SubscriptionAction[];
};
