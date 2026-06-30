"use client";

import {
  LuBotMessageSquare,
  LuFileSearch2,
  LuTable,
  LuTrash2,
} from 'react-icons/lu';

import { type CartItem } from '@/providers/CartProvider';

type CartProductPlanProps = {
  items: CartItem[];
  onRemove: (id: string) => void;
};

const CartProductPlan = ({ items, onRemove }: CartProductPlanProps) => {
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
    <>
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
                  onClick={() => onRemove(item.id)}
                >
                  <LuTrash2 size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default CartProductPlan;
