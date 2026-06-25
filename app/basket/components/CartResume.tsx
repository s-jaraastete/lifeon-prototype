"use client";

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  LuChevronRight,
  LuTrash2,
  LuTable,
  LuFileSearch2,
  LuBotMessageSquare,
} from 'react-icons/lu'

import DiscountCoupon from './DiscountCoupon'
import SelectSuscription from './SelectSuscription'

const suscriptionOptions = [
  { value: 'plan-mensual', label: 'Suscripción mensual' },
  { value: 'plan-anual', label: 'Suscripción anual', subLabel: '15% OFF' },
]

const CartResume = () => {
  const [plan, setPlan] = useState<string>('plan-mensual')

  return (
    <div className="w-full bg-white">
      <div className="max-w-325 mx-auto">
        <div className="bg-white py-12.5">
          <div>
            <h1 className="text-[40px] leading-12 font-semibold mb-8">Carrito de compras</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="border border-gray-500 rounded-[22px] bg-white p-7.5">
                  <div className="flex items-center justify-between">

                    <div className="flex flex-col gap-7">
                      <h3 className="text-lg leading-6.5 font-medium">Producto</h3>
                      <div className="flex gap-4">
                        <div className="flex gap-1.5">
                          <div className="w-8 h-8 rounded-[10px] bg-[#00C7BE]/40 flex items-center justify-center">
                            <LuTable size={16} />
                          </div>
                          <div className="w-8 h-8 rounded-[10px] bg-[#007AFF]/40 flex items-center justify-center">
                            <LuFileSearch2 size={16} />
                          </div>
                          <div className="w-8 h-8 rounded-[10px] bg-[#AF52DE]/40 flex items-center justify-center">
                            <LuBotMessageSquare size={16} />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Paquete base esencial</div>
                          <div className="text-sm text-primary-text">(MIPER + Control documental + APR Virtual)</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-7">
                      <h3 className="text-lg leading-6.5 font-medium">Total</h3>
                      <div className="flex items-start gap-8">
                        <div className="text-primary-text">
                          <div className="text-sm">2.5 UF por mes</div>
                          <div className="text-sm">(Ref: $95.125 CLP)</div>
                        </div>
                        <button className="text-red-500 cursor-pointer m-1">
                          <LuTrash2 size={24} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-200 p-5 rounded-[22px]">
                  <h4 className="font-medium text-lg leading-6.5 text-black">
                    Próximamente más módulos para sumar a tu Paquete Base
                  </h4>
                  <p className="text-sm leading-5.5 text-primary-text">
                    Prepárate para sumar módulos especializados en camino. Flexibilidad total para el futuro de tu gestión.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <DiscountCoupon />
                
                <div className="border border-gray-500 rounded-2xl bg-white p-6">
                  <SelectSuscription
                    value={plan}
                    onValueChange={setPlan}
                    options={suscriptionOptions}
                    label="Suscripción"
                  />
                  
                  <h4 className="font-semibold text-lg">Total</h4>
                  <hr className="border-stroke my-5.5" />
                  <div className="flex flex-col gap-3 text-base">
                    <div className="flex justify-between items-baseline text-black ">
                      <span>Subtotal</span>
                      <div className="text-right">
                        <span>2,5 UF</span>
                        <span className="text-secondary-text ml-1.5">(Ref: $95.125 CLP)</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-baseline text-black">
                      <span>Descuento</span>
                      <div className="text-right">
                        <span>- 2.5 UF</span>
                        <span className="text-secondary-text ml-1.5">(Mes gratis)</span>
                      </div>
                    </div>
                    <hr className="border-stroke my-2" />
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-lg text-black">Total a pagar</span>
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-lg text-black">0 UF</span>
                        <span className="text-sm text-secondary-text">(Ref: $0 CLP)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10.5 bg-gray-100 rounded-[22px] py-2.5 px-5 text-xs leading-relaxed text-primary-text">
                    Tu prueba de 30 días comienza hoy por 0 UF y tu primer periodo
                    facturado se iniciará el 18/07/2026 por 2,5 UF mensual.
                    El botón &apos;Ir a pagar&apos; te redirigirá de forma segura para
                    inscribir tu método de pago y sellar tu activación, pero hoy
                    recibirás un comprobante por $0 CLP.
                    Puedes cambiar de plan o cancelar tu suscripción cuando quieras
                    desde tu panel antes de esa fecha.
                  </div>

                  <Link
                    href="/checkout"
                    className="block w-full mt-10.5"
                  >
                    <button
                      type="button"
                      className="mt-6 w-full py-3 rounded-lg text-white bg-primary hover:bg-red-600 cursor-pointer transition-colors duration-150 flex items-center justify-center gap-1.5"
                    >
                      Ir a pagar
                      <LuChevronRight size={20} />
                    </button>
                  </Link>

                  <div className="mt-4 flex items-center justify-end">
                    <Image
                      src="/images/pay_methods.png"
                      alt="Payment Method"
                      width={134}
                      height={100}
                      className='w-33 h-auto'
                    />
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