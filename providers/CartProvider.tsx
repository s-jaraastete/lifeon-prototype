'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'


export type CartBillingPeriod = 'monthly' | 'yearly'

export type CartPriceOption = {
  amount: number
  original_amount?: number | null
  discount_percentage?: number | null
  discount_label?: string | null
  currency: 'UF' | 'CLP' | 'USD'
  billing_period: CartBillingPeriod
  trial_days: number
  has_trial: boolean
  is_active: boolean
}

export type CartModule = {
  public_id: string
  name: string
  slug: string
  description?: string | null
}

export type CartItem = {
  public_id: string
  slug: string
  name: string
  description?: string | null
  priceOptions: CartPriceOption[]
  selectedBillingPeriod: CartBillingPeriod
  price?: number
  currency?: 'UF' | 'CLP' | 'USD'
  packModules: CartModule[]
}

export type CartCouponPreview = {
  coupon_code: string
  coupon_name: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  subtotal: number
  discount_total: number
  total: number
  currency: 'UF' | 'CLP' | 'USD'
}

type CartContextValue = {
  items: CartItem[]
  couponCode: string | null
  couponPreview: CartCouponPreview | null
  isHydrated: boolean
  addItem: (item: CartItem) => void
  updateItemBillingPeriod: (publicId: string, billingPeriod: CartBillingPeriod) => void
  removeItem: (publicId: string) => void
  hasItem: (publicId: string) => boolean
  clearCart: () => void
  applyCouponPreview: (preview: CartCouponPreview) => void
  clearCouponPreview: () => void
}

const CART_STORAGE_KEY = 'lifeon-cart-items-v2'
const CART_COUPON_STORAGE_KEY = 'lifeon-cart-coupon'

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

  const selectedBillingPeriod =
    item.selectedBillingPeriod
    ?? getDefaultBillingPeriod(priceOptions)

  const selectedPriceOption = getSelectedPriceOption(
    priceOptions,
    selectedBillingPeriod,
  )

  return {
    ...item,
    packModules: item.packModules ?? [],
    priceOptions,
    selectedBillingPeriod,
    price: selectedPriceOption?.amount ?? item.price,
    currency: selectedPriceOption?.currency ?? item.currency,
  }
}

const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [couponPreview, setCouponPreview] = useState<CartCouponPreview | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const storedItems = window.localStorage.getItem(CART_STORAGE_KEY)
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems) as CartItem[]
        const normalizedItems = parsedItems.map(normalizeCartItem)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(normalizedItems)
      }

      const storedCoupon = window.localStorage.getItem(CART_COUPON_STORAGE_KEY)
      if (storedCoupon) {
        setCouponPreview(JSON.parse(storedCoupon) as CartCouponPreview)
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY)
      window.localStorage.removeItem(CART_COUPON_STORAGE_KEY)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items, isHydrated])

  useEffect(() => {
    if (!isHydrated) return

    if (!couponPreview) {
      window.localStorage.removeItem(CART_COUPON_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(CART_COUPON_STORAGE_KEY, JSON.stringify(couponPreview))
  }, [couponPreview, isHydrated])

  const addItem = (item: CartItem) => {
    setCouponPreview(null)

    setItems([
      normalizeCartItem(item),
    ])
  }

  const updateItemBillingPeriod = (publicId: string, billingPeriod: CartBillingPeriod) => {
    setCouponPreview(null)
    setItems((currentItems) => currentItems.map((item) => {
      if (item.public_id !== publicId) {
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

  const removeItem = (publicId: string) => {
    setCouponPreview(null)

    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.public_id !== publicId
      )
    )
  }

  const clearCart = useCallback(() => {
    setCouponPreview(null)
    setItems([])
  }, [])

  const hasItem = (publicId: string) => items.some((item) => item.public_id === publicId)
  const couponCode = couponPreview?.coupon_code ?? null
  const applyCouponPreview = useCallback((preview: CartCouponPreview) => {
    setCouponPreview(preview)
  }, [])
  const clearCouponPreview = useCallback(() => {
    setCouponPreview(null)
  }, [])

  return (
    <CartContext.Provider
      value={{
        items,
        couponCode,
        couponPreview,
        isHydrated,
        addItem,
        updateItemBillingPeriod,
        removeItem,
        clearCart,
        hasItem,
        applyCouponPreview,
        clearCouponPreview,
      }}
    >
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
