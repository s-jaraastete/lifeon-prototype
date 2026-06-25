"use client"

import React from 'react'
import { useCart } from '@/providers/CartProvider'

const CartList = () => {
  const { items, isHydrated, removeItem, clearCart } = useCart()

  if (!isHydrated) return <p>Cargando carrito...</p>

  if (items.length === 0) return <p>El carrito está vacío</p>

  return (
    <div className="p-4 flex flex-col gap-4">
      <ul>
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-center gap-6">
            <div>
              <div className="font-medium">{item.name}</div>
              {item.description && (
                <div className="text-sm text-secondary-text">{item.description}</div>
              )}
            </div>
            <div className="flex gap-2">
              <p>${item.price}</p>
              <button onClick={() => removeItem(item.id)} className="text-sm text-red-600 cursor-pointer">Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={clearCart} className="mt-4 text-sm cursor-pointer">Vaciar carrito</button>
    </div>
  )
}

export default CartList