'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'


export type CartBillingPeriod = 'monthly' | 'yearly'

export type CartPriceOption = {
  id: number
  pack: number
  amount: number
  original_amount?: number | null
  discount_percentage?: number | null
  discount_label?: string | null
  currency: 'UF' | 'CLP' | 'USD'
  billing_period: CartBillingPeriod
  trial_days: number
  is_active: boolean
}

export type CartModule = {
  id: number
  name: string
  slug: string
  description?: string
}

export type CartItem = {
  id: string
  slug: string
  name: string
  description?: string
  priceOptions: CartPriceOption[]
  selectedBillingPeriod: CartBillingPeriod
  price?: number
  currency?: 'UF' | 'CLP' | 'USD'
  packModules: CartModule[]
}

type CartContextValue = {
  items: CartItem[]
  isHydrated: boolean
  addItem: (item: CartItem) => void
  updateItemBillingPeriod: (id: string, billingPeriod: CartBillingPeriod) => void
  removeItem: (id: string) => void
  clearCart: () => void
  hasItem: (id: string) => boolean
}

const CART_STORAGE_KEY = 'lifeon-cart-items'

const CartContext = createContext<CartContextValue | undefined>(undefined)

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

const normalizeCartItem = (item: CartItem): CartItem => {
  const priceOptions = item.priceOptions ?? []
  const selectedBillingPeriod = item.selectedBillingPeriod ?? getDefaultBillingPeriod(priceOptions)
  const selectedPriceOption = getSelectedPriceOption(priceOptions, selectedBillingPeriod)

  return {
    ...item,
    slug: item.slug ?? item.id,
    packModules: item.packModules ?? [],
    priceOptions,
    selectedBillingPeriod,
    price: selectedPriceOption?.amount ?? item.price,
    currency: selectedPriceOption?.currency ?? item.currency,
  }
}

const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const storedItems = window.localStorage.getItem(CART_STORAGE_KEY)
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems) as CartItem[]
        const normalizedItems = parsedItems.map(normalizeCartItem)
        setItems(normalizedItems)
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items, isHydrated])

  const addItem = (item: CartItem) => {
    setItems((currentItems) => {
      if (currentItems.some((currentItem) => currentItem.id === item.id)) {
        return currentItems
      }
      return [...currentItems, normalizeCartItem(item)]
    })
  }

  const updateItemBillingPeriod = (id: string, billingPeriod: CartBillingPeriod) => {
    setItems((currentItems) => currentItems.map((item) => {
      if (item.id !== id) {
        return item
      }

      const selectedPriceOption = getSelectedPriceOption(item.priceOptions, billingPeriod)

      return {
        ...item,
        selectedBillingPeriod: billingPeriod,
        price: selectedPriceOption?.amount,
        currency: selectedPriceOption?.currency,
      }
    }))
  }

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setItems([])
  }

  const hasItem = (id: string) => items.some((item) => item.id === id)

  return (
    <CartContext.Provider value={{ items, isHydrated, addItem, updateItemBillingPeriod, removeItem, clearCart, hasItem }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}

export default CartProvider
