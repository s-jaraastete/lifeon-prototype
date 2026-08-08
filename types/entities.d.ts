interface Region {
	id: number;
	name: string;
	code: string;
	tipo: 'region';
}

interface Commune {
	id: number;
	name: string;
	code: string;
	tipo: 'commune';
	region: number;
	region_code?: string | null;
	region_name?: string | null;
}

interface ProductModule {
  public_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

interface PackModulePrice {
  amount: string;
  currency: 'UF' | 'CLP' | 'USD';
  billing_period: 'monthly' | 'yearly';
  is_active: boolean;
}

interface PackModule {
  inclusion_type: 'included' | 'optional';
  display_order: number;
  is_active: boolean;
  module: ProductModule;
  prices: PackModulePrice[];
}

interface PackPrice {
  amount: string;
  original_amount: string | null;
  discount_percentage: string | null;
  discount_label: string | null;
  currency: 'UF' | 'CLP' | 'USD';
  billing_period: 'monthly' | 'yearly';
  trial_days: number;
  has_trial: boolean;
  is_active: boolean;
}

interface Entitlement {
  key: string;
  name: string;
  description: string | null;
  value_type: 'boolean' | 'integer' | 'decimal' | 'text';
}

interface PackEntitlement {
  value: boolean | number | string | null;
  display_name: string | null;
  display_value: string | null;
  display_order: number;
  is_active: boolean;
  entitlement: Entitlement;
}

interface Pack {
  public_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  plan_type: 'free' | 'paid' | 'custom';
  cta_type: 'registration' | 'checkout' | 'contact';
  subscription_group: string;
  sort_order: number;
  is_featured: boolean;
  badge: string | null;
  is_active: boolean;
  pack_modules: PackModule[];
  prices: PackPrice[];
  entitlements: PackEntitlement[];
}

interface CheckoutCompanyPayload {
	name: string;
	company_rut: string;
	business_activity?: string | null;
	billing_email: string;
	billing_address?: string | null;
	region_id: number;
	commune_id: number;
}

interface CheckoutContactPayload {
	first_name: string;
	last_name: string;
	email: string;
	phone?: string | null;
}

interface CheckoutOrderPayload {
	company: CheckoutCompanyPayload;
	contact: CheckoutContactPayload;
	pack_public_id: string;
	billing_period: 'monthly' | 'yearly';
	coupon_code?: string | null;
	payment_method: 'webpay';
}

interface CheckoutOrderResponse {
	id?: number;
	order_public_id?: string;
  subscription_public_id?: string;
	order_number: string;
	status: 'pending_payment' | 'paid' | 'cancelled' | 'expired' | 'failed';
	subtotal: string;
	discount_total: string;
	total: string;
	currency: 'UF' | 'CLP' | 'USD';
	uf_value_snapshot: number;
	payment_method: 'webpay';
}

interface CheckoutResultData {
  subscription_public_id: string;
  order_public_id: string;
  order_number: string;
  status: 'trialing' | 'pending_initial_payment' | 'active' | 'pending_payment_method';
  billing_period: 'monthly' | 'yearly';
  pack_name: string;
	pack_description: string;
  amount_uf: number;
  amount_clp: number;
  trial_days: number;
  trial_ends_at: string | null;
  next_billing_at: string | null;
	inscription_status: 'redirect_ready' | 'processing' | 'completed' | 'failed' | 'expired' | null;
  inscription_error_code: string | null;
	initial_payment_public_id: string;
	initial_payment_status: string;
	initial_payment_attempt_status: string;
	initial_payment_response_code: number;
}

interface OneclickStartResponse {
  inscription_public_id: string;
  subscription_public_id: string;
  status: 'redirect_ready';
  token: string;
  url_webpay: string;
  expires_at: string;
}

interface CheckoutFlowResponse {
  order: CheckoutOrderResponse;
  inscription: OneclickStartResponse;
}

interface RetryInitialPaymentResponse {
  payment_public_id: string;
  payment_status: 'paid' | 'failed' | 'pending' | 'processing';
  payment_attempt_status:
    | 'approved'
    | 'rejected'
    | 'created'
    | 'processing'
    | 'error';
  subscription_public_id: string;
  subscription_status:
    | 'pending_initial_payment'
    | 'active';
  order_public_id: string;
  order_number: string;
  order_status: 'pending_payment' | 'paid' | 'failed';
  amount_clp: number;
  provider_response_code: number | null;
}