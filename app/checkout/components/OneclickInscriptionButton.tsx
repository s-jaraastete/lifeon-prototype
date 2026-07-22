'use client';

import { useState } from 'react';

interface OneclickStartResponse {
  inscription_public_id: string;
  subscription_public_id: string;
  status: 'redirect_ready';
  token: string;
  url_webpay: string;
  expires_at: string;
}

interface OneclickInscriptionButtonProps {
  subscriptionPublicId: string;
}

const OneclickInscriptionButton = ({
  subscriptionPublicId,
}: OneclickInscriptionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_HOST}/subscriptions/${subscriptionPublicId}/oneclick/inscription/start/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errorData: unknown = await response.json();

        console.error('Error al iniciar Oneclick:', errorData);

        throw new Error(
          'No fue posible iniciar la inscripción del medio de pago.'
        );
      }

      const data: OneclickStartResponse = await response.json();

      submitToTransbank({
        token: data.token,
        urlWebpay: data.url_webpay,
      });

    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.'
      );

      setIsLoading(false);
    }
  };

  const submitToTransbank = ({
    token,
    urlWebpay,
  }: {
    token: string;
    urlWebpay: string;
  }) => {
    const form = document.createElement('form');

    form.method = 'POST';
    form.action = urlWebpay;

    const tokenInput = document.createElement('input');

    tokenInput.type = 'hidden';
    tokenInput.name = 'TBK_TOKEN';
    tokenInput.value = token;

    form.appendChild(tokenInput);
    document.body.appendChild(form);

    form.submit();
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleInscription}
        disabled={isLoading}
        className="cursor-pointer rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading
          ? 'Redirigiendo a Transbank...'
          : 'Test Inscribir tarjeta'}
      </button>

      {error && <p>{error}</p>}
    </div>
  );
};

export default OneclickInscriptionButton;

