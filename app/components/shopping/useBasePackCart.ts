/* 'use client'

import { useState } from 'react'
import { CartBillingPeriod, CartItem, CartModule, CartPriceOption, useCart } from '@/providers/CartProvider'
import getBasePack from './actions/getBasePack'


interface UseBasePackCartResult {
  addBasePackToCart: () => Promise<CartItem | null>
  isAddingBasePack: boolean
  error: Error | null
}

const getDefaultBillingPeriod = (priceOptions: CartPriceOption[]): CartBillingPeriod => {
  const monthlyOption = priceOptions.find((priceOption) => priceOption.is_active && priceOption.billing_period === 'monthly')
  if (monthlyOption) {
    return 'monthly'
  }

  const firstActiveOption = priceOptions.find((priceOption) => priceOption.is_active)
  return firstActiveOption?.billing_period ?? 'monthly'
}

const getSelectedPriceOption = (
  priceOptions: CartPriceOption[],
  billingPeriod: CartBillingPeriod,
): CartPriceOption | undefined => {
  return priceOptions.find((priceOption) => priceOption.is_active && priceOption.billing_period === billingPeriod)
    ?? priceOptions.find((priceOption) => priceOption.is_active)
}

const mapPackModules = (packModules: PackModule[]): CartModule[] => {
  return packModules
    .filter((packModule) => packModule.is_active)
    .map((packModule) => ({
      public_id: packModule.module.public_id,
      name: packModule.module.name,
      slug: packModule.module.slug,
      description: packModule.module.description ?? undefined,
    }))
}

const mapPackPrices = (prices: PackPrice[]): CartPriceOption[] => {
  return prices.map((price) => ({
    amount: Number(price.amount),
    original_amount: price.original_amount !== null ? Number(price.original_amount) : null,
    discount_percentage: price.discount_percentage !== null ? Number(price.discount_percentage) : null,
    discount_label: price.discount_label,
    currency: price.currency,
    billing_period: price.billing_period,
    trial_days: price.trial_days,
    has_trial: price.has_trial,
    is_active: price.is_active,
  }))
}

const mapPackToCartItem = (pack: Pack): CartItem => {
  const priceOptions = mapPackPrices(pack.prices)
  const selectedBillingPeriod = getDefaultBillingPeriod(priceOptions)
  const selectedPriceOption = getSelectedPriceOption(priceOptions, selectedBillingPeriod)

  return {
    public_id: pack.public_id,
    slug: pack.slug,
    name: pack.name,
    description: pack.description ?? undefined,
    priceOptions,
    selectedBillingPeriod,
    price: selectedPriceOption?.amount,
    currency: selectedPriceOption?.currency,
    packModules: mapPackModules(pack.pack_modules),
  }
}

const useBasePackCart = (slug: string): UseBasePackCartResult => {
  const { addItem, items } = useCart()
  const [isAddingBasePack, setIsAddingBasePack] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const addBasePackToCart = async (): Promise<CartItem | null> => {
    const existingCartItem = items.find((item) => item.slug === slug)
    if (existingCartItem) {
      return existingCartItem
    }

    setIsAddingBasePack(true)
    setError(null)

    try {
      const pack = await getBasePack(slug)

      if (!pack) {
        const emptyPackError = new Error(`Pack not found for slug: ${slug}`)
        setError(emptyPackError)
        return null
      }

      const cartItem = mapPackToCartItem(pack)
      addItem(cartItem)

      return cartItem
    } catch (queryError) {
      const normalizedError = queryError instanceof Error
        ? queryError
        : new Error('Failed to load the selected pack')

      setError(normalizedError)
      return null
    } finally {
      setIsAddingBasePack(false)
    }
  }

  return {
    addBasePackToCart,
    isAddingBasePack,
    error,
  }
}

export default useBasePackCart;
 */

//TODO: REMOVER