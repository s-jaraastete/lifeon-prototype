import { CartBillingPeriod, CartItem, CartPriceOption } from '@/providers/CartProvider'

export const REFERENCE_CURRENCY = 'CLP' as const


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

export const getReferencePrice = (priceOption: CartPriceOption | undefined, ufValue: number) => {
  if (!priceOption) {
    return undefined
  }

  return formatReferenceAmount(
    priceOption.amount * ufValue
  )
}

export const getReferenceFinalPrice = (priceOption: CartPriceOption | undefined, ufValue: number) => {
  if (!priceOption) {
    return undefined
  }

  return getReferencePrice(
    priceOption,
    ufValue
  )
}

export const getDiscountAmount = (priceOption: CartPriceOption | undefined) => {
  if (!priceOption?.original_amount) {
    return undefined
  }

  return priceOption.original_amount - priceOption.amount
}

export const getTotalDueToday = (priceOption: CartPriceOption | undefined) => {
  if (!priceOption) {
    return undefined
  }

  return priceOption.amount
}

export const getDiscountLabel = (priceOption: CartPriceOption | undefined) => {
  if (!priceOption) {
    return undefined
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
