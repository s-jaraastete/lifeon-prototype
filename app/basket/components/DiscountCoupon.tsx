import TextInput from '@/app/components/ui/TextInput';
import React from 'react'

const DiscountCoupon = () => {
  return (
    <div className="border border-gray-500 rounded-[22px] bg-white p-6">
      <h4 className="font-medium text-lg leading-6.5">Aplicar cupón</h4>
      <p className="text-base text-primary-text mb-2.5">¿Tienes un cupón de descuento?</p>
      <div className="flex gap-2.5">
        <div className="grow">
          <TextInput
            placeholder="Ingresa el código"
            className="w-full"
          />
        </div>
        <button className="bg-red-500 text-white px-6 rounded-[14px] cursor-pointer transition hover:bg-red-600 duration-200">
          Aplicar
        </button>
      </div>
    </div>
  )
};

export default DiscountCoupon;