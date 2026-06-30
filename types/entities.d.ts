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
	currency: 'UF' | 'CLP' | 'USD';
	billing_period: 'monthly' | 'yearly';
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