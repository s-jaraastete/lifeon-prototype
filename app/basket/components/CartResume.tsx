"use client";

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { CartBillingPeriod, useCart } from '@/providers/CartProvider'
import { getDateAfterDays } from '@/utils/currentDate';
import { formatApiAmount } from '@/utils/pricingHelpers';

import CartProductPlan from './CartProductPlan'
import CartPricingBlock from './CartPricingBlock'
import DiscountCoupon from '../../checkout/components/DiscountCoupon';
import Listbox from '@/app/components/ui/Listbox'


// Icons
import { LuChevronLeft, LuChevronRight, LuShoppingCart } from 'react-icons/lu'


type CartResumeProps = {
  ufValue: number
}
// TODO: REMOVER TODO
const CartResume = ({ ufValue }: CartResumeProps) => {
  const [isCouponOpen, setIsCouponOpen] = useState(false)
  const { items, couponPreview, isHydrated, removeItem, updateItemBillingPeriod } = useCart()

  const isCartEmpty = items.length === 0
  const initialPlan = items[0] ?? null
  const selectedBillingPeriod = initialPlan?.selectedBillingPeriod ?? 'monthly'
  const selectedPriceOption = initialPlan?.priceOptions.find(
    (priceOption) => priceOption.is_active && priceOption.billing_period === selectedBillingPeriod,
  )
  const trialDays = selectedPriceOption?.trial_days ?? 30
  const recurringPrice = couponPreview?.total ?? initialPlan?.price
  const yearlyPriceOption = initialPlan?.priceOptions.find(
    (priceOption) => priceOption.is_active && priceOption.billing_period === 'yearly',
  )

  const suscriptionOptions = [
    {
      value: 'monthly',
      label: 'Suscripción mensual',
    },
    {
      value: 'yearly',
      label: 'Suscripción anual',
      subLabel: yearlyPriceOption?.discount_label
        ?? (yearlyPriceOption?.discount_percentage ? `${yearlyPriceOption.discount_percentage}% OFF` : undefined),
    },
  ]

  /*   const handleBillingPeriodChange = (value: string) => {
      if (!initialPlan) {
        return
      }
  
      updateItemBillingPeriod(initialPlan.id, value as CartBillingPeriod)
    } */

  return (
    <div className="w-full bg-white px-4 xl:px-0">
      <div className="max-w-325 mx-auto">
        <div className="bg-white py-8 lg:py-12.5">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Link
                href="/"
                className="flex items-center justify-center"
                aria-label="Volver al inicio"
              >
                <LuChevronLeft className="w-7.5 h-7.5" />
              </Link>
              <h1 className="text-[28px] lg:text-[40px] leading-12 font-semibold">Carrito de compras</h1>
            </div>

            {isHydrated && isCartEmpty && (
              <div className="h-120 flex flex-col items-center justify-center mb-10">
                <LuShoppingCart
                  className="text-secondary mb-2.5"
                  size={42}
                />
                <h2 className="text-3xl font-semibold leading-9.5">Carrito vacío</h2>
                <p className="text-lg text-primary-text">Agrega módulos a tu carrito</p>
                <Link
                  href="/"
                >
                  <button
                    type="button"
                    className="mt-6 w-full py-3 px-6 rounded-[14px] text-white bg-primary hover:bg-primary-hover cursor-pointer transition-colors duration-150 flex items-center justify-center gap-1.5"
                  >
                    Volver al inicio
                  </button>
                </Link>
              </div>
            )}

            {isHydrated && !isCartEmpty && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <CartProductPlan
                    items={items}
                    onRemove={removeItem}
                    ufValue={ufValue}
                  />

                  <div className="hidden lg:block bg-gray-200 p-5 rounded-[22px]">
                    <h4 className="font-medium text-lg leading-6.5 text-base-black">
                      Próximamente más módulos para sumar a tu Paquete Base
                    </h4>
                    <p className="text-sm leading-5.5 text-primary-text">
                      Prepárate para sumar módulos especializados en camino. Flexibilidad total para el futuro de tu gestión.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="hidden lg:block">
                    <DiscountCoupon />
                  </div>

                  <div className="border border-gray-500 rounded-[22px] bg-white p-6">
                    <Listbox
                      value={selectedBillingPeriod}
                      /* onValueChange={handleBillingPeriodChange} */
                      options={suscriptionOptions}
                      label="Suscripción"
                    />

                    <div className="lg:hidden">
                      {isCouponOpen ? (
                        <div className="mt-7.5">
                          <DiscountCoupon />
                        </div>
                      ) : (
                        <p className="mt-7.5 text-black">
                          ¿Tienes un cupón?{' '}
                          <button
                            type="button"
                            onClick={() => setIsCouponOpen(true)}
                            className="text-primary underline cursor-pointer"
                          >
                            Agregar
                          </button>
                        </p>
                      )}
                    </div>

                    {initialPlan && <CartPricingBlock plan={initialPlan} ufValue={ufValue} />}

                    {initialPlan?.selectedBillingPeriod === 'yearly' ? (
                      <p className="mt-10.5 bg-gray-100 rounded-[22px] py-2.5 px-5 text-xs leading-relaxed text-primary-text">
                        Tu prueba de {trialDays}{" "} días comienza hoy por 0 UF y tu primer periodo
                        facturado se iniciará el {getDateAfterDays(30)}{" "} por {formatApiAmount(recurringPrice)}{" "} UF anual.
                        El botón &apos;Ir a pagar&apos; te redirigirá de forma segura para
                        inscribir tu método de pago y sellar tu activación, pero hoy
                        recibirás un comprobante por $0 CLP.
                        Tienes hasta el día {trialDays} para cancelar en tu panel sin ningún cobro.
                      </p>
                    ) : (
                      <p className="mt-10.5 bg-gray-100 rounded-[22px] py-2.5 px-5 text-xs leading-relaxed text-primary-text">
                        Tu prueba de {trialDays}{" "} días comienza hoy por 0 UF y tu primer periodo
                        facturado se iniciará el {getDateAfterDays(30)}{" "} por {formatApiAmount(recurringPrice)}{" "} UF mensual.
                        El botón &apos;Ir a pagar&apos; te redirigirá de forma segura para
                        inscribir tu método de pago y sellar tu activación, pero hoy
                        recibirás un comprobante por $0 CLP.
                        Puedes cambiar de plan o cancelar tu suscripción cuando quieras
                        desde tu panel antes de esa fecha.
                      </p>
                    )}

                    <Link
                      href="/checkout"
                      className="block w-full mt-10.5"
                    >
                      <button
                        type="button"
                        className="mt-6 w-full py-3 rounded-[14px] text-white bg-primary hover:bg-primary-hover cursor-pointer transition-colors duration-150 flex items-center justify-center gap-1.5"
                      >
                        Ir a pagar
                        <LuChevronRight size={20} />
                      </button>
                    </Link>

                    <div className="mt-4 flex items-center justify-center lg:justify-end">
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartResume
