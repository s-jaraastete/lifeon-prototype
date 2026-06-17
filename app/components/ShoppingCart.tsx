import React, { useState } from 'react'
import { LuShoppingCart } from 'react-icons/lu';
import CartDrawer from './CartDrawer';


const ShoppingCart = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div>
        <div className="pt-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir carrito"
            className="relative cursor-pointer hover:text-gray-700"
          >
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              3
            </span>
            <LuShoppingCart className="w-6 h-6" />
          </button>
        </div>
      </div>

      <CartDrawer isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default ShoppingCart;