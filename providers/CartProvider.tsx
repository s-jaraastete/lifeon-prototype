'use client'

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';


export type BillingPeriod = 'monthly' | 'annual';
export interface PriceDetail {
  price: string;
  finalPrice: string;
  discountAmount?: string;
  discountPercentage?: number;   
  discountDescription?: string; 
  referencePrice?: string;
  referenceFinalPrice?: string;
}
export interface CartItem {
  id: string;
  name: string;
  description: string;
  currency: string;
  referenceCurrency?: string;
  selectedBillingPeriod: BillingPeriod;
  pricing: {
    monthly: PriceDetail;
    annual: PriceDetail;
  };
}

type CartContextValue = {
  items: CartItem[];
  isHydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  hasItem: (id: string) => boolean;
  setBillingPeriod: (period: BillingPeriod) => void;
}

const CART_STORAGE_KEY = 'lifeon-cart-items';

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedItems = window.localStorage.getItem(CART_STORAGE_KEY)
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems) as CartItem[]
        setItems(parsedItems)
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
      return [...currentItems, item]
    })
  }

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setItems([])
  }

  const hasItem = (id: string) => items.some((item) => item.id === id)

  const setBillingPeriod = (period: BillingPeriod) => {
    setItems((prev) =>
      prev.map((item) => ({ ...item, selectedBillingPeriod: period }))
    )
  }

  return (
    <CartContext.Provider value={{ items, isHydrated, addItem, removeItem, clearCart, hasItem, setBillingPeriod }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
};

export default CartProvider;
