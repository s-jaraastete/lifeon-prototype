"use client";

import Image from 'next/image';
import Link from 'next/link';
import {
  LuShoppingCart,
  LuChevronRight,
  LuTrash2,
  LuTable,
  LuFileSearch2,
  LuBotMessageSquare,
} from 'react-icons/lu';

import { BillingPeriod, useCart } from '@/providers/CartProvider';
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
  const initialPlanIcons = (
    <div className="group flex">
      <div className="w-8 h-8 rounded-[10px] border-2 border-white bg-white overflow-hidden relative z-10">
        <div className="w-full h-full bg-[#AF52DE]/40 flex items-center justify-center">
          <LuTable size={16} />
        </div>
      </div>
      <div className="w-8 h-8 rounded-[10px] border-2 border-white bg-white overflow-hidden relative z-20 -ml-4 group-hover:ml-0 transition-all duration-300">
        <div className="w-full h-full bg-[#007AFF]/40 flex items-center justify-center">
          <LuFileSearch2 size={16} />
        </div>
      </div>
      <div className="w-8 h-8 rounded-[10px] border-2 border-white bg-white overflow-hidden relative z-30 -ml-4 group-hover:ml-0 transition-all duration-300">
        <div className="w-full h-full bg-[#00C7BE]/40 flex items-center justify-center">
          <LuBotMessageSquare size={16} />
        </div>
      </div>
    </div>
  );

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
                  {items.map((item) => (
                    <div key={item.id} className="border border-gray-500 rounded-[22px] bg-white p-7.5">
                      <div className="flex flex-col lg:flex-row justify-between">
                        <div className="flex flex-col gap-7">
                          <h3 className="text-lg leading-6.5 font-medium">Producto</h3>
                          <div className="flex items-start gap-4">
                            {initialPlanIcons}
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-primary-text">{item.description}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-7">
                          <h3 className="text-lg leading-6.5 font-medium">Total</h3>
                          <div className="flex items-start justify-between gap-8 min-w-54">
                            <div className="text-primary-text">
                              {item.selectedBillingPeriod === 'annual' && item.pricing[item.selectedBillingPeriod].discountPercentage ? (
                                <>
                                  <div className="text-sm">
                                    <span className="line-through font-light text-secondary-text pe-2">
                                      {item.pricing[item.selectedBillingPeriod].price}
                                      {" "}
                                      {item.currency}
                                    </span>
                                    <span className="bg-secondary font-medium leading-5 text-white rounded-[14px] px-2 py-0.5 text-xs">
                                      -{item.pricing[item.selectedBillingPeriod].discountPercentage}%
                                    </span>
                                  </div>
                                  <div className="text-sm text-black">
                                    {item.pricing[item.selectedBillingPeriod].finalPrice}
                                    {" "}
                                    {item.currency}
                                    {" "}
                                    por el año
                                  </div>
                                </>
                              ) : (
                                <div className='text-sm'>
                                  {item.pricing[item.selectedBillingPeriod].price}
                                  {" "}
                                  {item.currency}
                                </div>
                              )}
                              <div className="text-sm">
                                (Ref: ${item.pricing[item.selectedBillingPeriod].referencePrice}
                                {" "}
                                {item.referenceCurrency})
                              </div>
                            </div>
                            <button
                              className="text-red-500 cursor-pointer m-1"
                              onClick={() => removeItem(item.id)}
                            >
                              <LuTrash2 size={24} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

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
                    
                    <h4 className="font-semibold text-lg">Total</h4>
                    <hr className="border-stroke my-5.5" />
                    <div className="flex flex-col gap-3 text-base">
                      <div className="flex justify-between items-baseline gap-8 text-black">
                        <span>Subtotal</span>
                        <div className="text-right">
                          <span>
                            {initialPlan.pricing[initialPlan.selectedBillingPeriod].price}
                            {" "}
                            {initialPlan.currency}
                          </span>
                          {initialPlan.pricing[initialPlan.selectedBillingPeriod].referencePrice && (
                            <span className="text-secondary-text ml-1.5">
                              (Ref: ${initialPlan.pricing[initialPlan.selectedBillingPeriod].referencePrice}
                              {" "}
                              {initialPlan.referenceCurrency})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-baseline gap-8 text-black">
                        <span>Descuento</span>
                        <div className="text-right">
                          <span>
                            - {initialPlan.pricing[initialPlan.selectedBillingPeriod].discountAmount}
                            {" "}
                            {initialPlan.currency}
                          </span>
                          {initialPlan.pricing[initialPlan.selectedBillingPeriod].discountDescription && (
                            <span className="text-secondary-text ml-1.5">
                              ({initialPlan.pricing[initialPlan.selectedBillingPeriod].discountDescription})
                            </span>
                          )}
                        </div>
                      </div>
                      <hr className="border-stroke my-2" />
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-lg text-black">Total a pagar</span>
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-lg text-black">
                            {initialPlan.pricing[initialPlan.selectedBillingPeriod].finalPrice}
                            {" "}
                            {initialPlan.currency}
                          </span>
                          {initialPlan.pricing[initialPlan.selectedBillingPeriod].referenceFinalPrice && (
                            <span className="text-sm text-secondary-text">
                              (Ref: ${initialPlan.pricing[initialPlan.selectedBillingPeriod].referenceFinalPrice}
                              {" "}
                              {initialPlan.referenceCurrency})
                            </span>
                          )}
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