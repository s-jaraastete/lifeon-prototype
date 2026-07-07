import type { CartItem } from '@/providers/CartProvider';
import {
  REFERENCE_CURRENCY,
  formatApiAmount,
  getActivePriceOption,
  getDiscountAmount,
  getDiscountLabel,
  getReferenceFinalPrice,
  getReferencePrice,
  getTotalDueToday,
} from '../../basket/components/pricingHelpers';
import { getDateAfterDays } from '@/utils/currentDate';
import { PAYMENT_METHODS } from './form/paymentMethodsData';

type CheckoutTotalsProps = {
  plan: CartItem | null;
  paymentMethodId: string;
};

const CheckoutTotals = ({ plan, paymentMethodId }: CheckoutTotalsProps) => {
  const selectedPriceOption = getActivePriceOption(plan, plan?.selectedBillingPeriod ?? 'monthly');
  const trialDays = selectedPriceOption?.trial_days ?? 30;

  const discountAmount = getDiscountAmount(selectedPriceOption);
  const discountLabel = getDiscountLabel(selectedPriceOption);
  const billingPeriod = plan?.selectedBillingPeriod ?? 'monthly';
  const referencePrice = getReferencePrice(billingPeriod);
  const totalDueToday = getTotalDueToday(selectedPriceOption);
  const referenceFinalPrice = selectedPriceOption?.trial_days
    ? '0'
    : getReferenceFinalPrice(billingPeriod);

  const paymentMethodIcon = PAYMENT_METHODS.find(
    (m) => m.id === paymentMethodId,
  )?.icon;

  return (
    <>
      <h2 className="text-2xl font-semibold">Orden total</h2>
        <div className="flex justify-between mt-5.5 gap-8">
          <div>
            <p className="font-medium">
              Suscripción
              {" "}
              {plan?.selectedBillingPeriod === 'monthly' ? 'mensual' : 'anual'}
            </p>
            <p className="font-medium">{plan?.name}</p>
            <p className="text-sm">({plan?.description})</p>
          </div>
          <div className="flex flex-col items-end text-nowrap text-sm">
            <div>
              {formatApiAmount(selectedPriceOption?.amount)}
              {" "}
              {plan?.currency}
              {" "}
              por {plan?.selectedBillingPeriod === 'monthly' ? 'mes' : 'año'}
            </div>
            <div className="text-primary-text">
              (Ref: ${referencePrice}
              {" "}
              {REFERENCE_CURRENCY})
            </div>
          </div>
        </div>

      <hr className="border-stroke my-5.5" />
      <div className="flex flex-col gap-3 text-base">
        <div className="flex justify-between gap-8 text-black">
          <span>Subtotal</span>
          <div className="text-right">
            <span>
              {formatApiAmount(selectedPriceOption?.amount)}
              {" "}
              {plan?.currency}
            </span>
            <span className="text-secondary-text ml-1.5">
              (Ref: ${referencePrice}
              {" "}
              {REFERENCE_CURRENCY})
            </span>
          </div>
        </div>
        {discountAmount !== undefined && (
          <div className="flex justify-between gap-8 text-black">
            <span>Descuento</span>
            <div className="text-right">
              <span>
                - {formatApiAmount(discountAmount)}
                {" "}
                {plan?.currency}
              </span>
              {discountLabel && (
                <span className="text-secondary-text ml-1.5">
                  ({discountLabel})
                </span>
              )}
            </div>
          </div>
        )}
        <hr className="border-stroke my-2" />
        <div className="flex justify-between">
          <span className="text-black">Total a pagar</span>
          <div className="flex flex-col items-end">
            <span className="text-black">
              {formatApiAmount(totalDueToday)}
              {" "}
              {plan?.currency}
            </span>
            {referenceFinalPrice && (
              <span className="text-sm text-secondary-text">
                (Ref: ${referenceFinalPrice}
                {" "}
                {REFERENCE_CURRENCY})
              </span>
            )}
          </div>
        </div>
      </div>

      {paymentMethodId && (
        <>
          <div className="flex justify-between items-center mt-5.5">
            <span className="text-black">Método de pago</span>
            {paymentMethodIcon}
          </div>
          {trialDays > 0 && (
            <>
              <hr className="border-stroke my-10.5" />
              <p className="bg-gray-100 rounded-[22px] py-2.5 px-5 text-xs leading-relaxed text-primary-text">
                Para activar tus {trialDays} días de acceso gratuito es
                necesario configurar tu método de pago. Hoy se realizará una
                validación por $0 {REFERENCE_CURRENCY} en tu cuenta para
                verificar la tarjeta. Los cobros recurrentes de{" "}
                {formatApiAmount(selectedPriceOption?.amount)} {plan?.currency}{" "}
                {plan?.selectedBillingPeriod === 'monthly' ? 'mensuales' : 'anuales'}{" "}
                se ejecutarán de forma automática a partir del{" "}
                {getDateAfterDays(trialDays)}. Recuerda que no tienes contratos de amarre
                y puedes cancelar cuando quieras desde tu panel para evitar
                futuros cargos.
              </p>
            </>
          )}
        </>
      )}
    </>
  )
}

export default CheckoutTotals;