import React, { useState } from 'react'
import { LuShoppingCart } from 'react-icons/lu';
import CartDrawer from './CartDrawer';
import Link from 'next/link';


const ShoppingCart = () => {
  /* const [open, setOpen] = useState(false); */

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
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                0
              </span>
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