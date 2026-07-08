interface ProductModule {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	is_active: boolean;
}

interface PackPrice {
	id: number;
	pack: number;
	amount: string;
	original_amount: string | null;
	discount_percentage: string | null;
	discount_label: string | null;
	currency: 'UF' | 'CLP' | 'USD';
	billing_period: 'monthly' | 'yearly';
	trial_days: number;
	is_active: boolean;
}

interface PackModule {
	id: number;
	pack: number;
	is_active: boolean;
	module: ProductModule;
}

interface Pack {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	is_active: boolean;
	pack_modules: PackModule[];
	prices: PackPrice[];
}

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
	pack_id: number;
	billing_period: 'monthly' | 'yearly';
	coupon_code?: string | null;
	payment_method: 'webpay';
}

interface CheckoutOrderResponse {
	id: number;
	order_number: string;
	status: 'pending_payment' | 'paid' | 'cancelled' | 'expired' | 'failed';
	subtotal: string;
	discount_total: string;
	total: string;
	currency: 'UF' | 'CLP' | 'USD';
	payment_method: 'webpay';
}
