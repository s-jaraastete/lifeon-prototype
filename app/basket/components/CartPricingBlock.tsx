"use client";

import { type CartItem } from '@/providers/CartProvider';

const CartPricingBlock = ({ plan }: {plan: CartItem}) => (
  <>
    <h4 className="font-semibold text-lg">Total</h4>
    <hr className="border-stroke my-5.5" />
    <div className="flex flex-col gap-3 text-base">
      <div className="flex justify-between items-baseline gap-8 text-black">
        <span>Subtotal</span>
        <div className="text-right">
          <span>
            {plan.pricing[plan.selectedBillingPeriod].price}
            {" "}
            {plan.currency}
          </span>
          {plan.pricing[plan.selectedBillingPeriod].referencePrice && (
            <span className="text-secondary-text ml-1.5">
              (Ref: ${plan.pricing[plan.selectedBillingPeriod].referencePrice}
              {" "}
              {plan.referenceCurrency})
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-between items-baseline gap-8 text-black">
        <span>Descuento</span>
        <div className="text-right">
          <span>
            - {plan.pricing[plan.selectedBillingPeriod].discountAmount}
            {" "}
            {plan.currency}
          </span>
          {plan.pricing[plan.selectedBillingPeriod].discountDescription && (
            <span className="text-secondary-text ml-1.5">
              ({plan.pricing[plan.selectedBillingPeriod].discountDescription})
            </span>
          )}
        </div>
      </div>
      <hr className="border-stroke my-2" />
      <div className="flex justify-between items-baseline">
        <span className="font-medium text-lg text-black">Total a pagar</span>
        <div className="flex flex-col items-end">
          <span className="font-medium text-lg text-black">
            {plan.pricing[plan.selectedBillingPeriod].finalPrice}
            {" "}
            {plan.currency}
          </span>
          {plan.pricing[plan.selectedBillingPeriod].referenceFinalPrice && (
            <span className="text-sm text-secondary-text">
              (Ref: ${plan.pricing[plan.selectedBillingPeriod].referenceFinalPrice}
              {" "}
              {plan.referenceCurrency})
            </span>
          )}
        </div>
      </div>
    </div>
  </>
);

export default CartPricingBlock;
