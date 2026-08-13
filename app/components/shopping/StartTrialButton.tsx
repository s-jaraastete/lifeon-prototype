'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import useBasePackCart from './useBasePackCart'


interface StartTrialButtonProps {
  slug: string
  children: ReactNode
  className?: string
  pendingText?: string
  redirectTo?: string | null
}

const StartTrialButton = ({
  slug,
  children,
  className = '',
  pendingText = 'Cargando pack...',
  redirectTo = '/basket',
}: StartTrialButtonProps) => {
  const router = useRouter()
  const { addBasePackToCart, isAddingBasePack, error } = useBasePackCart(slug)

  const handleClick = async () => {
    try {
      const cartItem = await addBasePackToCart()

      if (cartItem && redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      console.error('Failed to start trial', error)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isAddingBasePack}
        aria-busy={isAddingBasePack}
        className={className}
      >
        {isAddingBasePack ? pendingText : children}
      </button>
      {error && (
        <p className="text-sm text-red-500">
          {error.message}
        </p>
      )}
    </div>
  )
}

export default StartTrialButton;
