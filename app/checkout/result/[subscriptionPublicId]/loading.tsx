const CheckoutResultLoading = () => {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6">
      <section className="flex flex-col items-center text-center">
        <div
          aria-hidden="true"
          className="mb-4 size-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#059669]"
        />

        <h1 className="text-lg font-semibold text-neutral-900">
          Estamos procesando tu pago
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Esto puede tardar unos segundos. No cierres ni actualices esta
          ventana.
        </p>
      </section>
    </main>
  );
};

export default CheckoutResultLoading;