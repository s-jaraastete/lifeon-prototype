"use client";

import Image from 'next/image';
import Link from 'next/link';
import { LuShoppingCart, LuChevronRight } from 'react-icons/lu';

import { BillingPeriod, useCart } from '@/providers/CartProvider';
import CartProductPlan from './CartProductPlan';
import CartPricingBlock from './CartPricingBlock';
import DiscountCoupon from './DiscountCoupon';
import SelectSuscription from './SelectSuscription';

const CartResume = () => {
  const {
    items,
    isHydrated,
    removeItem,
    setBillingPeriod,
  } = useCart();

  const isCartEmpty = items.length === 0;

  // Initial item to fill the subscription sidebar with totals, as only one plan exists for now
  const initialPlan = items[0];

  const annualDiscount = initialPlan?.pricing.annual.discountPercentage;
  const suscriptionOptions = [
    {
      value: 'monthly',
      label: 'Suscripción mensual',
    },
    {
      value: 'annual',
      label: 'Suscripción anual',
      subLabel: annualDiscount ? `${annualDiscount}% OFF` : undefined,
    },
  ];

  return (
    <div className="w-full bg-white">
      <div className="max-w-325 mx-auto">
        <div className="bg-white py-12.5">
          <div>
            <h1 className="text-[40px] leading-12 font-semibold mb-8">Carrito de compras</h1>

            {isHydrated && isCartEmpty && (
              <div className="h-120 flex flex-col items-center justify-center mb-10">
                <LuShoppingCart
                  className="text-secondary mb-2.5"
                  size={42}
                />
                <h2 className="text-3xl font-semibold leading-9.5">Carrito Vacío</h2>
                <p className="text-lg text-primary-text">Agrega módulos a tu carrito</p>
                <Link
                  href="/"
                  className="mt-3.5"
                >
                  <button
                    type="button"
                    className="mt-6 w-full py-3 px-6 rounded-[14px] text-white bg-primary hover:bg-red-600 cursor-pointer transition-colors duration-150 flex items-center justify-center gap-1.5"
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
                  />

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
                      value={initialPlan?.selectedBillingPeriod}
                      onValueChange={(value) => setBillingPeriod(value as BillingPeriod)}
                      options={suscriptionOptions}
                      label="Suscripción"
                    />

                    <CartPricingBlock plan={initialPlan} />

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
                        className="mt-6 w-full py-3 rounded-[14px] text-white bg-primary hover:bg-red-600 cursor-pointer transition-colors duration-150 flex items-center justify-center gap-1.5"
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
};

export default CartResume;