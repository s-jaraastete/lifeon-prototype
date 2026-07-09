'use client'

import TextInput from '@/app/components/ui/TextInput';
import { getActivePriceOption } from '@/utils/pricingHelpers';
import axiosManager from '@/lib/axios_manager';
import { useCart, type CartCouponPreview } from '@/providers/CartProvider';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React, { type FormEvent, useState } from 'react'


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

type CouponPreviewPayload = {
  pack_id: number
  billing_period: string
  coupon_code: string
}

type CouponInputState = {
  billingKey: string
  value: string
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
  const selectedPriceOption = getActivePriceOption(initialPlan, initialPlan?.selectedBillingPeriod ?? 'monthly')
  const isCouponDisabled = (selectedPriceOption?.trial_days ?? 0) > 0
  const billingKey = initialPlan
    ? `${initialPlan.id}:${initialPlan.selectedBillingPeriod}`
    : ''
  const [couponInput, setCouponInput] = useState<CouponInputState>({
    billingKey,
    value: couponCode ?? '',
  })
  const couponInputValue = !isCouponDisabled && couponInput.billingKey === billingKey
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

  const handleApplyCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isCouponDisabled) {
      return
    }

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
      pack_id: Number(initialPlan.id),
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
    <div className="border border-gray-500 rounded-[22px] bg-white p-6">
      <h4 className="font-medium text-lg leading-6.5">Aplicar cupón</h4>
      <p className="text-base text-primary-text mb-2.5">¿Tienes un cupón de descuento?</p>
      <form className="flex gap-2.5" onSubmit={handleApplyCoupon}>
        <div className="grow">
          <TextInput
            placeholder="Ingresa el código"
            className="w-full"
            value={couponInputValue}
            disabled={isApplying || isCouponDisabled}
            error={!isCouponDisabled ? error ?? undefined : undefined}
            onChange={(event) => setCouponInput({
              billingKey,
              value: event.target.value,
            })}
          />
        </div>
        <button
          type="submit"
          disabled={isApplying || isCouponDisabled}
          className="h-12 bg-red-500 text-white px-6 rounded-[14px] cursor-pointer transition hover:bg-red-600 duration-200 disabled:cursor-not-allowed disabled:bg-gray-500"
        >
          {isApplying ? 'Aplicando' : 'Aplicar'}
        </button>
      </form>

      {isCouponDisabled && (
        <p className="mt-3 text-sm text-primary-text">
          Los cupones estarán disponibles para planes sin periodo gratuito.
        </p>
      )}

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
