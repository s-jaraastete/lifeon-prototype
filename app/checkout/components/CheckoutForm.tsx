"use client";

import { useState } from "react";

import type { FormFields } from "@/hooks/useFormValidation";
import useFormValidation from "@/hooks/useFormValidation";
import { useCart } from "@/providers/CartProvider";
import CheckoutCollapse from "./CheckoutCollapse";
import PersonalData from "./form/PersonalData";
import BillingData from "./form/BillingData";
import PaymentMethod from "./form/PaymentMethod";
import CheckoutTotals from './CheckoutTotals';
import createOrderCheckout from './actions/create_order_checkout';

type SectionId = "personal" | "billing" | "payment";

const PERSONAL_FIELDS: (keyof FormFields)[] = [
  "first_name",
  "last_name",
  "email",
  "phone",
];
const BILLING_FIELDS: (keyof FormFields)[] = [
  "rut",
  "business_name",
  "business_line",
  "billing_email",
  "address",
  "region",
  "comuna",
];
const PAYMENT_FIELDS: (keyof FormFields)[] = [
  "payment_method",
];

export default function CheckoutForm() {
  const { items, isHydrated, couponCode } = useCart();
  const plan = items[0] ?? null;

  const [activeSection, setActiveSection] = useState<SectionId | null>("personal");
  const [form, setForm] = useState<FormFields>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    rut: "",
    business_name: "",
    business_line: "",
    billing_email: "",
    address: "",
    region: "",
    comuna: "",
    payment_method: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { errors } = useFormValidation(form);

  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const handleFieldChange = (field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
  };
  const handleFieldBlur = (field: keyof FormFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const toggle = (section: SectionId) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isButtonDisabled) return;

    setIsPending(true);
    setMessage(null);
    setOrderNumber(null);

    try {
      const payload: CheckoutOrderPayload = {
        company: {
          name: form.business_name ?? '',
          company_rut: form.rut ?? '',
          business_activity: form.business_line,
          billing_email: form.billing_email ?? '',
          billing_address: form.address,
          region_id: Number(form.region),
          commune_id: Number(form.comuna),
        },
        contact: {
          first_name: form.first_name ?? '',
          last_name: form.last_name ?? '',
          email: form.email ?? '',
          phone: form.phone,
        },
        pack_id: Number(plan?.id),
        billing_period: plan?.selectedBillingPeriod ?? 'monthly',
        coupon_code: couponCode,
        payment_method: 'webpay',
      };

      const response = await createOrderCheckout(
        payload,
        null,
        new FormData(event.currentTarget)
      );

      if (response.status === 'success') {
        setOrderNumber(response.data?.order_number ?? null);
        setMessage(null);
        console.log('Orden creada:', response.data?.order_number);
        return;
      }

      setMessage('No se pudo crear la orden.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsPending(false);
    }
  };

  const isPersonalCompleted = PERSONAL_FIELDS.every(
    (f) => touched[f] && errors[f] == null,
  );
  const isBillingCompleted = BILLING_FIELDS.every(
    (f) => touched[f] && errors[f] == null,
  );
  const isPaymentCompleted = PAYMENT_FIELDS.every(
    (f) => touched[f] && errors[f] == null,
  );

  const isButtonDisabled = !(isPersonalCompleted && isBillingCompleted && isPaymentCompleted);

  if (!isHydrated) return null;

  return (
    <form 
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" 
      onSubmit={handleSubmit}
    >
      <div className="lg:col-span-2 flex flex-col gap-5.5">
        <CheckoutCollapse
          title="Datos personales"
          active={activeSection === "personal"}
          onToggle={() => toggle("personal")}
          completed={isPersonalCompleted}
        >
          <PersonalData
            values={form}
            errors={errors}
            touched={touched}
            onFieldChange={handleFieldChange}
            onFieldBlur={handleFieldBlur}
          />
        </CheckoutCollapse>

        <CheckoutCollapse
          title="Datos de facturación"
          active={activeSection === "billing"}
          onToggle={() => toggle("billing")}
          completed={isBillingCompleted}
        >
          <BillingData
            values={form}
            errors={errors}
            touched={touched}
            onFieldChange={handleFieldChange}
            onFieldBlur={handleFieldBlur}
          />
        </CheckoutCollapse>

        <CheckoutCollapse
          title="Método de pago"
          active={activeSection === "payment"}
          onToggle={() => toggle("payment")}
          completed={isPaymentCompleted}
        >
          <PaymentMethod
            value={form.payment_method ?? ""}
            onChange={(v) => handleFieldChange("payment_method", v)}
          />
        </CheckoutCollapse>
      </div>
      <div>
        <div className="border border-gray-400 rounded-[22px] p-5">
          <CheckoutTotals
            plan={plan}
            paymentMethodId={form.payment_method ?? ""}
          />

          <button
            disabled={isButtonDisabled || isPending}
            type="submit"
            className={`
              w-full font-medium mt-10.5 px-6 py-3 rounded-[14px] transition duration-200
              ${
                isButtonDisabled || isPending
                  ? "text-secondary-text bg-gray-300"
                  : "text-white bg-primary hover:bg-red-600 cursor-pointer"
              }
            `}
          >
            {isPending ? 'Creando orden...' : 'Finalizar y pagar'}
          </button>
          {message && <p className="text-sm mt-2 text-red-500">{message}</p>}
        </div>
      </div>
    </form>
  );
}
