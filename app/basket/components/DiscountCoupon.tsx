import TextInput from '@/app/components/ui/TextInput';
import React from 'react'

const DiscountCoupon = () => {
  return (
    <div className="border border-gray-400 rounded-2xl bg-white p-6">
      <h4 className="font-medium mb-1">Aplicar cupón</h4>
      <p className="text-sm text-primary-text mb-2">¿Tienes un cupón de descuento?</p>
      <div className="flex gap-3">
        <TextInput
          placeholder="Ingresa el código"
          className='text-sm'
        />
        <button className="bg-red-500 text-white px-4 rounded-xl cursor-pointer transition hover:bg-red-600 duration-200">
          Aplicar
        </button>
      </div>
    </div>
  )
};

export default DiscountCoupon;