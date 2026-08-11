import Image from 'next/image';
import { useState, type ReactNode } from 'react';

import type { CartCouponPreview, CartItem } from '@/providers/CartProvider';
import {
  REFERENCE_CURRENCY,
  formatApiAmount,
  getActivePriceOption,
  getDiscountAmount,
  getDiscountLabel,
  getReferenceFinalPrice,
  getReferencePrice,
  getTotalDueToday,
} from '@/utils/pricingHelpers';
import { PAYMENT_METHODS } from './form/PaymentMethod';
import DiscountCoupon from './DiscountCoupon';

// Icons
import { LuFileSearch2, LuTable } from 'react-icons/lu';


type CheckoutModule = {
  icon: ReactNode;
  bgIcon: string;
  text: string;
  hasAiBadge?: boolean;
};

type CheckoutTotalsProps = {
  plan: CartItem | null;
  paymentMethodId: string;
  couponPreview?: CartCouponPreview | null;
  ufValue: number;
};

const IPERModule = {
  icon: <LuTable size={10} className="text-black" />,
  bgIcon: "bg-purple-300",
  text: 'Matriz IPER ',
};

const DocumentationModule = {
  icon: <LuFileSearch2 size={10} className="text-black" />,
  bgIcon: "bg-sky-300",
  text: 'Programa y Documentación preventiva ',
};

const APRVirtualModule = {
  icon: <Image src="/svg/apr-icon.svg" width={10} height={10} alt="APR" />,
  bgIcon: "bg-gradient-to-b from-[#BDE7FF] to-[#ADF2D3]",
  text: 'APR Virtual',
};

const modulesByName: Record<string, CheckoutModule> = {
  MIPER: IPERModule,
  "Programa y Documentación Preventiva": DocumentationModule,
  "APR Virtual": APRVirtualModule,
};

const CheckoutTotals = ({ plan, paymentMethodId, couponPreview, ufValue }: CheckoutTotalsProps) => {
  const [showCoupon, setShowCoupon] = useState(false);

  const selectedPriceOption = getActivePriceOption(plan, plan?.selectedBillingPeriod ?? 'monthly');
  const discountAmount = getDiscountAmount(selectedPriceOption);
  const discountLabel = getDiscountLabel(selectedPriceOption);
  const billingPeriod = plan?.selectedBillingPeriod ?? 'monthly';
  const monthlyEquivalent =
    billingPeriod === 'yearly' && selectedPriceOption
      ? Number(selectedPriceOption.amount) / 12
      : Number(selectedPriceOption?.amount ?? 0);
  const referencePrice = getReferencePrice(selectedPriceOption, ufValue);
  const baseTotalDueToday = getTotalDueToday(selectedPriceOption)
  const totalDueToday = couponPreview?.total ?? baseTotalDueToday
  const referenceFinalPrice = getReferenceFinalPrice(selectedPriceOption, ufValue);
  const hasYearlyDiscount = billingPeriod === 'yearly'
    && Boolean(selectedPriceOption?.discount_percentage)
    && selectedPriceOption?.original_amount !== null
    && selectedPriceOption?.original_amount !== undefined

  const paymentMethodIcon = PAYMENT_METHODS.find(
    (m) => m.id === paymentMethodId,
  )?.icon;

//TODO: LIMPIAR COMENTARIOS
  return (
    <>
      <h2 className="text-xl font-semibold">Resumen de tu plataforma</h2>
        <hr className="border-stroke my-5.5" />
        <div className="flex justify-between mt-5.5 gap-8">
          <div>
            <p className="font-medium">
              Plan seleccionado
              {/* Suscripción
              {" "}
              {plan?.selectedBillingPeriod === 'monthly' ? 'mensual' : 'anual'} */}
            </p>
            {/* <p className="font-medium">{plan?.name}</p>
            <p className="text-sm">({plan?.description})</p> */}
            <p className='text-xs text-primary-text'>
              {plan?.selectedBillingPeriod === 'monthly' ? 'Suscripción mensual' : 'Suscripción anual'}
            </p>
          </div>
          <div className="flex flex-col items-end text-nowrap text-sm">
            {/* {hasYearlyDiscount && (
              <div className="text-sm">
                <span className="line-through font-light text-secondary-text pe-2">
                  {formatApiAmount(selectedPriceOption?.original_amount)}
                  {" "}
                  {plan?.currency}
                </span>
                <span className="bg-secondary font-medium leading-5 text-white rounded-[14px] px-2 py-0.5 text-xs">
                  -{selectedPriceOption?.discount_percentage}%
                </span>
              </div>
            )} */}
            <div>
              {/* {formatApiAmount(selectedPriceOption?.amount)}
              {" "}
              {plan?.currency}
              {" "}
              por {plan?.selectedBillingPeriod === 'monthly' ? 'mes' : 'el año'} */}
              <p className='font-medium text-secondary text-base'>
                {plan?.name}
              </p>
            </div>
            {/* <div className="text-primary-text">
              (Ref: ${referencePrice}
              {" "}
              {REFERENCE_CURRENCY})
            </div> */}
          </div>
        </div>
        <div>
          <div className="font-medium pt-5.5">
            Plataforma base
            <div className='pt-2 flex flex-col gap-2'>
              {plan?.packModules.map((module) => {
                const moduleInfo = modulesByName[module.name];

                return (
                <div key={module.name} className='flex items-center gap-2'>
                  {moduleInfo && (
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${moduleInfo.bgIcon}`}>
                      {moduleInfo.icon}
                    </span>
                  )}
                  <p className='text-sm text-primary-text font-normal'>
                    {moduleInfo?.text ?? module.name}
                  </p>
                </div>
                );
              })}
            </div>
            {/* Suscripción
            {" "}
            {plan?.selectedBillingPeriod === 'monthly' ? 'mensual' : 'anual'} */}
          </div>
        </div>

      <hr className="border-stroke my-5.5" />
      <div className="flex flex-col gap-3 text-base">
        <div className="flex justify-between gap-8 text-black">
          <p className='font-medium'>Suscripción base</p>
          <div className="flex flex-col text-right">
            <span className='text-primary-text'>
              {formatApiAmount(monthlyEquivalent)}
              {" "}
              {plan?.currency}
              {" "}
              {plan?.selectedBillingPeriod === 'monthly' ? 'mes' : 'por mes'}
            </span>
            {plan?.selectedBillingPeriod === 'yearly' && (
              <span className="text-primary-text ml-1.5">
                (Total año: {formatApiAmount(selectedPriceOption?.amount)} UF)
              </span>
            )}
          </div>
        </div>
        <div className='pt-4 flex flex-col gap-4'>
          <div className='flex items-center gap-2'>
            <p className='font-medium'>¿Tienes un cupón?</p>
            <button 
              className='font-medium text-primary underline cursor-pointer transition duration-200 hover:text-red-600'
              onClick={() => setShowCoupon((prev) => !prev)}
              type='button'
            >
              {showCoupon === false ? 'Agregar' : 'Ocultar'}
            </button>
          </div>
          {showCoupon && (
            <DiscountCoupon />
          )}
        </div>
        {/* {discountAmount !== undefined && (
          <div className="flex justify-between gap-8 text-black">
            <span>Descuento</span>
            <div className="text-right">
              <span>
                - {formatApiAmount(discountAmount)}
                {" "}
                {plan?.currency}
              </span>
              {discountLabel && (
                <span className="text-secondary-text ml-1.5">
                  ({discountLabel})
                </span>
              )}
            </div>
          </div>
        )} */}
        {couponPreview && (
          <div className="flex justify-between gap-8 text-black">
            <span>Cupón</span>
            <div className="text-right">
              <span>
                - {formatApiAmount(couponPreview.discount_total)}
                {" "}
                {couponPreview.currency}
              </span>
              <span className="text-secondary-text ml-1.5">
                ({couponPreview.coupon_code})
              </span>
            </div>
          </div>
        )}
        <hr className="border-stroke my-2" />
        <div className="flex justify-between">
          <span className="text-black">Total a pagar</span>
          <div className="flex flex-col items-end">
            <span className="text-black font-medium">
              {formatApiAmount(totalDueToday)}
              {" "}
              {plan?.currency}
            </span>
            {referenceFinalPrice && (
              <span className="text-sm text-secondary-text">
                (Ref: ${referenceFinalPrice}
                {" "}
                {REFERENCE_CURRENCY})
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className={`
          grid transition-[grid-template-rows,opacity] duration-300 ease-in-out 
          ${paymentMethodId ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
        `}>
        <div className="overflow-hidden">
          <div className="flex justify-between mt-5.5">
            <span className="text-black">Método de pago</span>
            {paymentMethodId && paymentMethodIcon}
          </div>
        </div>
      </div>
    </>
  )
}

export default CheckoutTotals;
