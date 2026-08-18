"use client";

import Image from 'next/image';
import { type CartItem } from '@/providers/CartProvider'
import { REFERENCE_CURRENCY, formatApiAmount, getActivePriceOption, getReferencePrice } from '@/utils/pricingHelpers';

// Icons
import { LuFileSearch2, LuTable, LuTrash2 } from 'react-icons/lu';


type CartProductPlanProps = {
  items: CartItem[]
  onRemove: (id: string) => void
  ufValue: number
}

const CartProductPlan = ({ items, onRemove, ufValue }: CartProductPlanProps) => {
  const basePackCards = (
    <div className="group flex">
      <div className="w-8 h-8 rounded-[10px] border-2 border-white bg-white overflow-hidden relative z-10">
        <div className="w-full h-full bg-[#AF52DE]/40 flex items-center justify-center">
          <LuTable size={16} />
        </div>
      </div>
      <div className="w-8 h-8 rounded-[10px] border-2 border-white bg-white overflow-hidden relative z-20 -ml-4">
        <div className="w-full h-full bg-[#007AFF]/40 flex items-center justify-center">
          <LuFileSearch2 size={16} />
        </div>
      </div>
      <div className="w-8 h-8 rounded-[10px] border-2 border-white bg-white overflow-hidden relative z-30 -ml-4">
        <div className="w-full h-full bg-linear-to-b from-azure-100 to-emerald-200 flex items-center justify-center">
          <Image 
            src="/svg/apr-icon.svg" 
            width={16}
            height={16} 
            alt="APR Virtual"
          />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {items.map((item) => {
        const selectedPriceOption = getActivePriceOption(item, item.selectedBillingPeriod)
        const hasYearlyDiscount = item.selectedBillingPeriod === 'yearly'
          && Boolean(selectedPriceOption?.discount_percentage)
          && selectedPriceOption?.original_amount !== null
          && selectedPriceOption?.original_amount !== undefined

        const referencePrice = getReferencePrice(selectedPriceOption, ufValue)

        return (
          <div key={item.public_id} className="border border-gray-500 rounded-[22px] bg-white p-7.5">
            <div className="flex justify-between items-baseline lg:items-end">
              <div className="flex flex-col lg:flex-row gap-2 lg:gap-7.5">
                <div className="flex flex-col gap-7">
                  <h3 className="hidden lg:block text-lg leading-6.5 font-medium">Producto</h3>
                  <div className="flex items-start gap-3">
                    {item.slug === 'paquete-base-esencial' && basePackCards}
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-primary-text">({item.description})</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-7">
                  <h3 className="hidden lg:block text-lg leading-6.5 font-medium">Total</h3>
                  <div className="flex items-start justify-between gap-8 min-w-54 ps-20 lg:ps-0">
                    <div className="text-primary-text">
                      {hasYearlyDiscount ? (
                        <>
                          <div className="text-sm">
                            <span className="line-through font-light text-secondary-text pe-2">
                              {formatApiAmount(selectedPriceOption?.original_amount)}
                              {" "}
                              {item.currency}
                            </span>
                            <span className="bg-secondary font-medium leading-5 text-white rounded-[14px] px-2 py-0.5 text-xs">
                              -{selectedPriceOption?.discount_percentage}%
                            </span>
                          </div>
                          <div className="text-sm text-secondary lg:text-black font-medium lg:font-normal">
                            {formatApiAmount(selectedPriceOption?.amount)}
                            {" "}
                            {item.currency}
                            {" "}
                            por el año
                          </div>
                        </>
                      ) : (
                        <div className='text-sm text-secondary lg:text-black font-medium lg:font-normal'>
                          {formatApiAmount(selectedPriceOption?.amount)}
                          {" "}
                          {item.currency}
                          {" "}
                          por mes
                        </div>
                      )}
                      <div className="text-sm">
                        (Ref: ${referencePrice}
                        {" "}
                        {REFERENCE_CURRENCY})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="text-red-500 cursor-pointer m-1 lg:pb-3 transition duration-200 hover:text-primary-pressed"
                onClick={() => onRemove(item.public_id)}
              >
                <LuTrash2 size={24} />
              </button>
            </div>
          </div>
        )
      })}
    </>
  )
}

export default CartProductPlan
