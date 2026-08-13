'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import retryInitialPayment from './actions/retry_initial_payment';


interface RetryInitialPaymentButtonProps {
  subscriptionPublicId: string;
}

const RetryInitialPaymentButton = ({ subscriptionPublicId }: RetryInitialPaymentButtonProps) => {
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRetryPayment = async () => {
    if (isPending) return;

    setIsPending(true);
    setMessage(null);

    try {
      const response = await retryInitialPayment(
        subscriptionPublicId
      );

      if (response.payment_status === 'paid') {
        router.refresh();
        return;
      }

      if (response.payment_status === 'failed') {
        setMessage(
          'El pago volvió a ser rechazado. Intenta nuevamente más tarde.'
        );
        return;
      }

      setMessage(
        'No fue posible confirmar el resultado del pago.'
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al reintentar el pago.'
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className='w-full md:w-auto'>
      <button
        type="button"
        disabled={isPending}
        onClick={handleRetryPayment}
        className={`
          mt-4 inline-flex min-h-11 items-center justify-center w-full  rounded-xl px-16 font-medium transition duration-200 md:w-auto md:mt-8
          ${
            isPending
              ? 'cursor-not-allowed bg-gray-300 text-gray-500'
              : 'bg-primary text-white hover:bg-primary-hover cursor-pointer'
          }
        `}
      >
        {isPending
          ? 'Procesando pago...'
          : 'Reintentar pago'}
      </button>

      {message && (
        <p className="mt-3 text-sm text-red-500">
          {message}
        </p>
      )}
    </div>
  );
};

export default RetryInitialPaymentButton;