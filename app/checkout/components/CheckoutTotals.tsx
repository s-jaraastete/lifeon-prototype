"use client";

import { useCart } from '@/providers/CartProvider';
import {
  REFERENCE_CURRENCY,
  formatApiAmount,
  getActivePriceOption,
  getDiscountAmount,
  getDiscountLabel,
  getReferenceFinalPrice,
  getReferencePrice,
  getTotalDueToday,
} from '../../basket/components/pricingHelpers';

const BILLING_PERIOD = {
  monthly: 'mensual',
  yearly: 'anual',
}

const CheckoutTotals = () => {
  const { items } = useCart();

  const plan = items[0] ?? null;
  const selectedPriceOption = getActivePriceOption(plan, plan?.selectedBillingPeriod);
  const discountAmount = getDiscountAmount(selectedPriceOption);
  const discountLabel = getDiscountLabel(selectedPriceOption);
  const referencePrice = getReferencePrice(plan?.selectedBillingPeriod);
  const totalDueToday = getTotalDueToday(selectedPriceOption);
  const referenceFinalPrice = selectedPriceOption?.trial_days
    ? '0'
    : getReferenceFinalPrice(plan?.selectedBillingPeriod);

  return (
    <>
      <h2 className="text-2xl font-semibold">Orden total</h2>
        <div className="flex justify-between mt-5.5 gap-8">
          <div>
            <p className="font-medium">
              Suscripción
              {" "}
              {BILLING_PERIOD[plan?.selectedBillingPeriod]}
            </p>
            <p className="font-medium">{plan.name}</p>
            <p className="text-sm">({plan.description})</p>
          </div>
          <div className="flex flex-col items-end text-nowrap text-sm">
            <div>
              {formatApiAmount(selectedPriceOption?.amount)}
              {" "}
              {plan.currency}
              {" "}
              por {plan?.selectedBillingPeriod === 'monthly' ? 'mes' : 'año'}
            </div>
            <div className="text-primary-text">
              (Ref: ${referencePrice}
              {" "}
              {REFERENCE_CURRENCY})
            </div>
          </div>
        </div>

      <hr className="border-stroke my-5.5" />
      <div className="flex flex-col gap-3 text-base">
        <div className="flex justify-between items-baseline gap-8 text-black">
          <span>Subtotal</span>
          <div className="text-right">
            <span>
              {formatApiAmount(selectedPriceOption?.amount)}
              {" "}
              {plan.currency}
            </span>
            <span className="text-secondary-text ml-1.5">
              (Ref: ${referencePrice}
              {" "}
              {REFERENCE_CURRENCY})
            </span>
          </div>
        </div>
        {discountAmount !== undefined && (
          <div className="flex justify-between items-baseline gap-8 text-black">
            <span>Descuento</span>
            <div className="text-right">
              <span>
                - {formatApiAmount(discountAmount)}
                {" "}
                {plan.currency}
              </span>
              {discountLabel && (
                <span className="text-secondary-text ml-1.5">
                  ({discountLabel})
                </span>
              )}
            </div>
          </div>
        )}
        <hr className="border-stroke my-2" />
        <div className="flex justify-between items-baseline">
          <span className="font-medium text-lg text-black">Total a pagar</span>
          <div className="flex flex-col items-end">
            <span className="font-medium text-lg text-black">
              {formatApiAmount(totalDueToday)}
              {" "}
              {plan.currency}
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
    </>
  )
}

export default CheckoutTotals;
