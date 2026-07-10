import { CartBillingPeriod, CartItem, CartPriceOption } from '@/providers/CartProvider'

export const REFERENCE_CURRENCY = 'CLP' as const

const REFERENCE_MULTIPLIERS: Record<CartBillingPeriod, number> = {
  monthly: 2.5,
  yearly: 25.5,
}

const formatReferenceAmount = (value: number) => {
  return new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(Math.trunc(value))
}

export const getActivePriceOption = (
  item: CartItem | undefined | null,
  billingPeriod: CartBillingPeriod,
): CartPriceOption | undefined => {
  if (!item) {
    return undefined
  }

  return item.priceOptions.find((priceOption) => priceOption.is_active && priceOption.billing_period === billingPeriod)
    ?? item.priceOptions.find((priceOption) => priceOption.is_active)
}

export const getReferencePrice = (billingPeriod: CartBillingPeriod, ufValue: number) => {
  return formatReferenceAmount(REFERENCE_MULTIPLIERS[billingPeriod] * ufValue)
}

export const getReferenceFinalPrice = (billingPeriod: CartBillingPeriod, ufValue: number) => {
  if (billingPeriod !== 'yearly') {
    return undefined
  }

  return getReferencePrice(billingPeriod, ufValue)
}

export const getDiscountAmount = (priceOption: CartPriceOption | undefined) => {
  if (priceOption?.trial_days) {
    return priceOption.amount
  }

  if (!priceOption?.original_amount) {
    return undefined
  }

  return priceOption.original_amount - priceOption.amount
}

export const getTotalDueToday = (priceOption: CartPriceOption | undefined) => {
  if (!priceOption) {
    return undefined
  }

  return priceOption.trial_days > 0 ? 0 : priceOption.amount
}

export const getDiscountLabel = (priceOption: CartPriceOption | undefined) => {
  if (!priceOption) {
    return undefined
  }

  if (priceOption.trial_days > 0) {
    return priceOption.billing_period === 'yearly'
      ? 'Mes de prueba + Contrato diferido'
      : 'Mes gratis'
  }

  return priceOption.discount_label ?? undefined
}

export const formatApiAmount = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return undefined
  }

  return new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 2,
  }).format(value)
}
