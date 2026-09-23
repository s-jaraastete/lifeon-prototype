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

export type InvoiceMetric = {
  value: number;
  change_percentage?: number;
};

export type InvoiceDashboardOverview = {
  billed_this_month: InvoiceMetric;
  collected_this_month: InvoiceMetric;
  pending_collection: InvoiceMetric;
  overdue: InvoiceMetric;
};

export type InvoiceStatus =
  | "paid"
  | "pending"
  | "overdue"
  | "cancelled"
  | "issued";

export type InvoiceDocumentStatus = "pending" | "ready" | "failed";

export type InvoicePaymentMethod = {
  provider: string;
  card_type: string | null;
  card_last_four: string | null;
};

export type Invoice = {
  public_id: string;
  invoice_number: string;
  subscription_id: string;
  order_number: string | null;
  payment_public_id: string | null;
  payment_type: string | null;
  company_name_snapshot: string;
  company_rut_snapshot: string | null;
  billing_email_snapshot: string | null;
  total_amount_clp: number;
  net_amount_clp: number;
  tax_amount_clp: number;
  tax_rate_percent: number;
  issued_at: string;
  due_date: string | null;
  status: InvoiceStatus;
  payment_method: InvoicePaymentMethod | null;
  document_status: InvoiceDocumentStatus;
  document_available: boolean;
  document_generated_at: string | null;
  download_url: string | null;
};
