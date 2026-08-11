'use client'

import TextInput from '@/app/components/ui/TextInput';
import axiosManager from '@/lib/axios_manager';
import { useCart, type CartCouponPreview } from '@/providers/CartProvider';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react'


type CouponPreviewPayload = {
  pack_public_id: string
  billing_period: 'monthly' | 'yearly'
  coupon_code: string
}

type CouponInputState = {
  billingKey: string
  value: string
}

const getCouponErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return 'No fue posible aplicar el cupón.'
  }

  const responseData = error.response?.data
  const couponError = responseData?.coupon_code

  if (Array.isArray(couponError)) {
    return couponError[0]
  }

  if (typeof couponError === 'string') {
    return couponError
  }

  return 'No fue posible aplicar el cupón.'
}

const previewCoupon = (payload: CouponPreviewPayload) => {
  return axiosManager('/checkout/coupon/preview/', payload, {
    method: 'post',
  }) as Promise<CartCouponPreview>
}

const DiscountCoupon = () => {
  const {
    items,
    couponCode,
    couponPreview,
    applyCouponPreview,
    clearCouponPreview,
  } = useCart()

  const initialPlan = items[0] ?? null
  const billingKey = initialPlan
    ? `${initialPlan.public_id}:${initialPlan.selectedBillingPeriod}`
    : ''
  const [couponInput, setCouponInput] = useState<CouponInputState>({
    billingKey,
    value: couponCode ?? '',
  })
  const couponInputValue =
    couponInput.billingKey === billingKey
      ? couponInput.value
      : ''
  const [error, setError] = useState<string | null>(null)

  const couponPreviewMutation = useMutation({
    mutationFn: previewCoupon,
    onSuccess: (preview) => {
      setError(null)
      applyCouponPreview(preview)
    },
    onError: (couponError) => {
      clearCouponPreview()
      setError(getCouponErrorMessage(couponError))
    },
  })

  const isApplying = couponPreviewMutation.isPending

  const handleApplyCoupon = () => {
    const normalizedCouponCode = couponInputValue.trim()

    if (!initialPlan) {
      setError('Agrega un plan antes de aplicar un cupón.')
      return
    }

    if (!normalizedCouponCode) {
      setError('Ingresa un código de cupón.')
      return
    }

    couponPreviewMutation.mutate({
      pack_public_id: initialPlan.public_id,
      billing_period: initialPlan.selectedBillingPeriod,
      coupon_code: normalizedCouponCode,
    })
  }

  const handleClearCoupon = () => {
    clearCouponPreview()
    setCouponInput({
      billingKey,
      value: '',
    })
    setError(null)
  }

  return (
    <div className="border border-gray-300 rounded-[22px] bg-white p-6">
      <h4 className="font-medium text-lg leading-6.5">Aplicar cupón</h4>
      <p className="text-base text-primary-text mb-2.5">¿Tienes un cupón de descuento?</p>
      <div className="flex gap-2.5">
        <div className="grow">
          <TextInput
            placeholder="Ingresa el código"
            className="w-full"
            value={couponInputValue}
            disabled={isApplying}
            error={error ?? undefined}
            onChange={(event) => setCouponInput({
              billingKey,
              value: event.target.value,
            })}
          />
        </div>
        <button
          type="button"
          disabled={isApplying}
          onClick={handleApplyCoupon}
          className="h-12 bg-red-500 text-white px-6 rounded-[14px] cursor-pointer transition hover:bg-red-600 duration-200 disabled:cursor-not-allowed disabled:bg-gray-500"
        >
          {isApplying ? 'Aplicando' : 'Aplicar'}
        </button>
      </div>

      {couponPreview && (
        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          <span className="text-primary-text">
            Cupón {couponPreview.coupon_code} aplicado
          </span>
          <button
            type="button"
            className="text-primary cursor-pointer hover:underline"
            onClick={handleClearCoupon}
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  )
};

export default DiscountCoupon;
