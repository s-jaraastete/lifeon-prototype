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
  const { addBasePackToCart, isAddingBasePack } = useBasePackCart(slug)

  const handleClick = async () => {
    try {
      await addBasePackToCart()

      if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      console.error('Failed to start trial', error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isAddingBasePack}
      className={className}
    >
      {isAddingBasePack ? pendingText : children}
    </button>
  )
}

export default StartTrialButton;