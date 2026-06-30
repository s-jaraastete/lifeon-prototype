'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axiosManager from '@/lib/axios_manager'
import { CartBillingPeriod, CartItem, CartModule, CartPriceOption, useCart } from '@/providers/CartProvider'


interface PacksResponse {
  results: Pack[]
}

interface UseBasePackCartResult {
  addBasePackToCart: () => Promise<CartItem>
  isAddingBasePack: boolean
  error: Error | null
}

const getPackBySlug = async (slug: string): Promise<Pack> => {
  const response = await axiosManager(`/packs/all/?slug=${encodeURIComponent(slug)}`, null, {
    method: 'get',
    useAccessToken: false,
  }) as PacksResponse

  const pack = response.results.find((item) => item.slug === slug && item.is_active) ?? response.results[0]

  if (!pack) {
    throw new Error(`Pack not found for slug: ${slug}`)
  }

  return pack
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
      id: packModule.module.id,
      name: packModule.module.name,
      slug: packModule.module.slug,
      description: packModule.module.description ?? undefined,
    }))
}

const mapPackPrices = (prices: PackPrice[]): CartPriceOption[] => {
  return prices.map((price) => ({
    id: price.id,
    pack: price.pack,
    amount: Number(price.amount),
    currency: price.currency,
    billing_period: price.billing_period,
    is_active: price.is_active,
  }))
}

const mapPackToCartItem = (pack: Pack): CartItem => {
  const priceOptions = mapPackPrices(pack.prices)
  const selectedBillingPeriod = getDefaultBillingPeriod(priceOptions)
  const selectedPriceOption = getSelectedPriceOption(priceOptions, selectedBillingPeriod)

  return {
    id: String(pack.id),
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
  const queryClient = useQueryClient()
  const { addItem } = useCart()
  const [isAddingBasePack, setIsAddingBasePack] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const addBasePackToCart = async (): Promise<CartItem> => {
    setIsAddingBasePack(true)
    setError(null)

    try {
      const pack = await queryClient.fetchQuery({
        queryKey: ['packs', 'by-slug', slug],
        queryFn: () => getPackBySlug(slug),
        staleTime: 1000 * 60 * 5,
      })

      const cartItem = mapPackToCartItem(pack)
      addItem(cartItem)

      return cartItem
    } catch (queryError) {
      const normalizedError = queryError instanceof Error
        ? queryError
        : new Error('Failed to load the selected pack')

      setError(normalizedError)
      throw normalizedError
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

export default useBasePackCart