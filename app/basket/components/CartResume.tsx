import Image from 'next/image'
import Link from 'next/link'
import DiscountCoupon from './DiscountCoupon'

// Icons
import { LuChevronRight, LuTrash2 } from 'react-icons/lu'


type Item = {
  id: number
  title: string
  price: number
}

const items: Item[] = [
  { id: 1, title: 'Módulo MIPER', price: 100000 },
  { id: 2, title: 'Módulo Asset Integrity e Inspecciones Estructurales', price: 50000 },
  { id: 3, title: 'Investigación de accidentes', price: 75000 },
]

const CartResume = () => {
  const subtotal = items.reduce((s, i) => s + i.price, 0)
  const discount = 10000
  const total = subtotal - discount
  const disabled = items.length === 0 || total <= 0

  return (
    <div className="w-full bg-white">
      <div className="max-w-360 mx-auto">
        <div className="bg-white py-12.5">
          <div>
            <h1 className="text-4xl font-semibold mb-2">Carrito de compras</h1>
            <p className="text-primary-text mb-8">
              Revisa tus módulos seleccionados y elige la modalidad de tu suscripción para activar tu plataforma.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="border border-gray-400 rounded-2xl bg-white p-6 flex gap-6">
                  <div className="w-1/2">
                    <label className="block font-medium mb-2">Plan</label>
                    <select className="w-full border rounded-lg p-3 text-sm text-gray-600">
                      <option>Selecciona un plan</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="block font-medium mb-2">Suscripción</label>
                    <select className="w-full border rounded-lg p-3 text-sm text-gray-600">
                      <option>Selecciona una suscripción</option>
                    </select>
                  </div>
                </div>

                <div className="border border-gray-400 rounded-2xl bg-white p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium">Producto</h3>
                    <h3 className="text-lg font-medium pr-12">Total</h3>
                  </div>

                  <ul className="flex flex-col gap-4">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                            ICO
                          </div>
                          <div>
                            <div className="font-medium">{item.title}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-sm text-primary-text">${item.price} CLP</div>
                          <button 
                            className="text-red-500 p-2 rounded cursor-pointer hover:bg-red-50"
                          >
                            <LuTrash2 />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <DiscountCoupon />
                
                <div className="border border-gray-400 rounded-2xl bg-white p-6">
                  <h4 className="font-medium mb-4">Total</h4>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>${subtotal} CLP</span></div>
                    <div className="flex justify-between"><span>Descuento</span><span>{discount} CLP</span></div>
                    <div className="border-t border-gray-400 pt-3 flex justify-between font-semibold"><span>Total</span><span>${total} CLP</span></div>
                  </div>

                  <Link href="/checkout">
                    <button
                      type="button"
                      disabled={disabled}
                      className={
                        disabled
                          ? 'mt-6 w-full py-3 rounded-lg text-gray-400 bg-gray-200 cursor-not-allowed'
                          : 'mt-6 w-full py-3 rounded-lg text-white bg-primary hover:bg-red-600 cursor-pointer transition-colors duration-150'
                      }
                    >
                      Ir a pagar
                      <LuChevronRight className="w-4 h-4 inline-block ml-2" />
                    </button>
                  </Link>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Image src="/images/pay_methods.png" alt="Payment Method" width={134} height={100} className='w-33 h-auto' />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default CartResume;