'use client';

import { useState } from 'react';
import retryOneclickInscription from './actions/retry_oneclick_inscription';


interface RetryOneclickInscriptionButtonProps {
  subscriptionPublicId: string;
}

const RetryOneclickInscriptionButton = ({ subscriptionPublicId }: RetryOneclickInscriptionButtonProps) => {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitToTransbank = ({
    token,
    urlWebpay,
  }: {
    token: string;
    urlWebpay: string;
  }) => {
    const transbankForm = document.createElement('form');

    transbankForm.method = 'POST';
    transbankForm.action = urlWebpay;

    const tokenInput = document.createElement('input');

    tokenInput.type = 'hidden';
    tokenInput.name = 'TBK_TOKEN';
    tokenInput.value = token;

    transbankForm.appendChild(tokenInput);
    document.body.appendChild(transbankForm);

    transbankForm.submit();
  };

  const handleRetryInscription = async () => {
    if (isPending) return;

    setIsPending(true);
    setMessage(null);

    try {
      const response = await retryOneclickInscription(
        subscriptionPublicId
      );

      submitToTransbank({
        token: response.token,
        urlWebpay: response.url_webpay,
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No fue posible reiniciar la inscripción de la tarjeta.'
      );

      setIsPending(false);
    }
  };

  return (
    <div className="w-full md:w-auto">
      <button
        type="button"
        disabled={isPending}
        onClick={handleRetryInscription}
        className={`
          mt-4 inline-flex min-h-11 items-center justify-center w-full  rounded-xl px-16 font-medium transition duration-200 md:w-auto md:mt-8
          ${
            isPending
              ? 'cursor-not-allowed bg-gray-300 text-gray-500'
              : 'bg-primary text-white hover:bg-red-600 cursor-pointer'
          }
        `}
      >
        {isPending
          ? 'Redirigiendo a Transbank...'
          : 'Reintentar suscripción'}
      </button>

      {message && (
        <p className="mt-3 text-sm text-red-500">
          {message}
        </p>
      )}
    </div>
  );
};

export default RetryOneclickInscriptionButton;