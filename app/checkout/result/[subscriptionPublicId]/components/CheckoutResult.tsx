import Link from "next/link";
import { formatDateDDMMAAAA } from "@/utils/formatDate";
import ClearCartOnSuccess from "./ClearCartOnSuccess";
import RetryInitialPaymentButton from "./RetryInitialPaymentButton";

// Icons
import { LuCheck, LuCircleAlert } from "react-icons/lu";
import RetryOneclickInscriptionButton from "./RetryOneclickInscriptionButton";


interface CheckoutResultProps {
  result: CheckoutResultData;
}

const CheckoutResult = ({ result }: CheckoutResultProps) => {
  const isActive = result.status === 'active';
  const inscriptionFailed = result.inscription_status === 'failed';
  const initialPaymentFailed = result.initial_payment_status === 'failed';
  const showSuccessDetails = isActive;

  const title = isActive
    ? '¡Pago exitoso!'
    : initialPaymentFailed
      ? 'No pudimos procesar tu pago inicial'
      : inscriptionFailed
        ? 'No pudimos procesar tu suscripción'
        : 'No se pudo procesar la orden';

  const description = isActive
    ? 'Tu suscripción ya está activa. Hemos enviado un comprobante a tu correo electrónico y un enlace para el acceso a tu plataforma.'
    : 'Hubo un problema al validar tu método de pago. No se realizó ningún cargo.';

  return (
    <>
      <ClearCartOnSuccess status={result.status} />

      <main className="flex items-center justify-center px-6 py-20">
        <section className="w-full max-w-160 text-center">
          <div className={`mx-auto flex size-14 items-center justify-center rounded-full
            ${inscriptionFailed || initialPaymentFailed ? "bg-primary" : "bg-[#00C950]"}`}>
            <span
              aria-hidden="true"
              className="text-3xl font-semibold text-white"
            >
              {inscriptionFailed || initialPaymentFailed ? <LuCircleAlert />  : <LuCheck />}
            </span>
          </div>

          <h1 className="mt-5 text-[28px] md:text-[40px] font-semibold leading-12 text-neutral-900 md:mx-6">
            {title}
          </h1>

          <p className="mt-0 text-lg text-primary-text md:mt-5">
            {description}
          </p>

          <div className="mt-6 rounded-xl border border-gray-400 bg-white p-6 text-left">
            <div>
              <p className="text-lg font-semibold">
                {inscriptionFailed ? "Detalle del intento"  : "Resumen de tu compra"}
              </p>
            </div>

            <div className="my-5 border-t border-gray-300" />

            <div className="flex flex-col justify-between md:flex-row">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {result.billing_period === 'monthly'? 'Suscripción mensual': 'Suscripción anual'} · {result.pack_name}
                  </p>
                </div>
                <div>
                  <p className="text-secondary-text text-sm">
                    {result.pack_description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start mt-4 md:items-end md:mt-0 w-50">
                <div className="flex items-center gap-1">
                  <p className="font-medium">
                    {result.amount_uf} UF
                  </p>
                  <p className="font-medium">
                    {result.billing_period === 'monthly'? 'por mes': 'por año'}
                  </p>
                </div>
                <div>
                  <p className="text-secondary-text text-sm">
                    (Ref: ${result.amount_clp.toLocaleString('es-CL')} CLP)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="my-5 border-t border-gray-300" />
            
            {showSuccessDetails && (
            <>
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">
                    Total pagado hoy
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-end gap-1">
                    <p className="font-semibold">
                      {result.amount_uf} UF
                    </p>
                  </div>
                  <div>
                    <p className="text-secondary-text text-sm">
                      (Ref: ${result.amount_clp.toLocaleString('es-CL')} CLP)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-5">
                <div>
                  <p className="font-medium">
                    Próximo cobro
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-end gap-1">
                    <p className="text-primary-text">
                      {
                        result.next_billing_at === null ? "Sin información" :
                        `${formatDateDDMMAAAA(String(result.next_billing_at))}`
                      }
                    </p>
                    <span className="text-primary-text">·</span>
                    <p className="text-primary-text">
                      {result.amount_uf} UF
                    </p>
                  </div>
                </div>
              </div>
            </>
            )}

            {inscriptionFailed && 
              <div>
                <p className="font-semibold">
                  Motivo del rechazo
                </p>
                <p className="text-primary-text">
                  Tu banco rechazó la transacción. Verifica los datos de tu tarjeta o intenta con otro método de pago.
                </p>
              </div>
            }

            <div className="my-5 border-t border-gray-300" />

            <div className="flex justify-between gap-4">
              <p className="font-medium">{showSuccessDetails ? "N° de orden" : "N° de intento"} </p>
              <span className="text-primary-text">
                #{result.order_number}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            {inscriptionFailed && 
              <RetryOneclickInscriptionButton
                subscriptionPublicId={result.subscription_public_id}
              />
            }
            {initialPaymentFailed && 
              <RetryInitialPaymentButton
                subscriptionPublicId={result.subscription_public_id}
              />
            }
            <Link
              href={`${showSuccessDetails ? "/" : "/"}`}
              className={`${showSuccessDetails ? "mt-4" : "mt-0"} inline-flex min-h-11 items-center justify-center w-full  rounded-xl bg-white px-6 font-medium text-primary border-primary border transition duration-200 hover:bg-gray-200 md:w-auto md:mt-8`}
            >
              {showSuccessDetails ? "Volver a Inicio" : "Volver a Inicio"} 
            </Link>
          </div>

          <p className="text-secondary-text text-sm mt-6">
            ¿Tienes dudas? Escríbenos a 
            <a 
              className="pl-1 hover:underline" 
              href="mailto:soporte@lifeon.cl?subject=Consulta&body=Hola,%20quiero%20más%20información"
            >
              soporte@lifeon.cl
            </a>
          </p>
        </section>
      </main>
    </>
  );
};

export default CheckoutResult;
