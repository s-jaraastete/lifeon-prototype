import React, { useState } from 'react'
import { LuShoppingCart } from 'react-icons/lu';
import CartDrawer from './CartDrawer';
import Link from 'next/link';
import { useCart } from '@/providers/CartProvider';


const ShoppingCart = () => {
  /* const [open, setOpen] = useState(false); */
  const { items, isHydrated } = useCart();
  const itemCount = isHydrated ? items.length : 0;

  return (
    <>
      <div>
        <div className="pt-3">
          <Link href="/basket" >
            <button
              /* onClick={() => setOpen(true)} */
              aria-label="Abrir carrito"
              className="relative cursor-pointer hover:text-gray-700"
            >
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
              <LuShoppingCart className="w-6 h-6" />
            </button>
          </Link>
        </div>
      </div>
      {/* <CartDrawer isOpen={open} onClose={() => setOpen(false)} /> */}
    </>
  )
}

export default ShoppingCart;