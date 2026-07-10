"use client";

import { type CartItem, useCart } from '@/providers/CartProvider'
import {
  REFERENCE_CURRENCY,
  formatApiAmount,
  getActivePriceOption,
  getDiscountAmount,
  getDiscountLabel,
  getReferenceFinalPrice,
  getReferencePrice,
  getTotalDueToday,
} from '@/utils/pricingHelpers'


const CartPricingBlock = ({ plan, ufValue }: { plan: CartItem; ufValue: number }) => {
  const { couponPreview } = useCart()
  const selectedPriceOption = getActivePriceOption(plan, plan.selectedBillingPeriod)
  const discountAmount = getDiscountAmount(selectedPriceOption)
  const discountLabel = getDiscountLabel(selectedPriceOption)
  const referencePrice = getReferencePrice(plan.selectedBillingPeriod, ufValue)
  const baseTotalDueToday = getTotalDueToday(selectedPriceOption)
  const totalDueToday = selectedPriceOption?.trial_days
    ? baseTotalDueToday
    : couponPreview?.total ?? baseTotalDueToday
  const referenceFinalPrice = selectedPriceOption?.trial_days
    ? '0'
    : getReferenceFinalPrice(plan.selectedBillingPeriod, ufValue)

  return (
    <>
      <h4 className="font-semibold text-lg mt-5.5">Total</h4>
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
        {couponPreview && (
          <div className="flex justify-between items-baseline gap-8 text-black">
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

export default CartPricingBlock;
