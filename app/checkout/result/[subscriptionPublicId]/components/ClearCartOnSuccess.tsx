'use client';

import { useEffect } from 'react';
import { useCart } from '@/providers/CartProvider';

interface ClearCartOnSuccessProps {
  status: 'trialing' | 'pending_initial_payment' | 'active' | 'pending_payment_method';
}

const ClearCartOnSuccess = ({ status }: ClearCartOnSuccessProps) => {
  const { clearCart } = useCart();

  useEffect(() => {
    if (status === 'active') {
      clearCart();
    }
  }, [status, clearCart]);

  return null;
};

export default ClearCartOnSuccess;