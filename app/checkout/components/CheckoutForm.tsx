"use client";

import { useState } from "react";

import type { FormFields } from "@/hooks/useFormValidation";
import useFormValidation from "@/hooks/useFormValidation";
import { useCart } from "@/providers/CartProvider";
import CheckoutCollapse from "./CheckoutCollapse";
import CheckoutTotals from "./CheckoutTotals";
import PersonalData from "./form/PersonalData";
import BillingData from "./form/BillingData";
import PaymentMethod from "./form/PaymentMethod";

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
  const { items, isHydrated } = useCart();
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

  const isPersonalCompleted = PERSONAL_FIELDS.every(
    (f) => touched[f] && errors[f] == null,
  );
  const isBillingCompleted = BILLING_FIELDS.every(
    (f) => touched[f] && errors[f] == null,
  );
  const isPaymentCompleted = PAYMENT_FIELDS.every(
    (f) => touched[f] && errors[f] == null,
  );
  const isBillingUnlocked = isPersonalCompleted;
  const isPaymentUnlocked = isBillingCompleted;

  const isButtonDisabled = !(isPersonalCompleted && isBillingCompleted && isPaymentCompleted);

  if (!isHydrated) return null;

  return (
    <form className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
          locked={!isBillingUnlocked}
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
          locked={!isPaymentUnlocked}
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
            disabled={isButtonDisabled}
            type="submit"
            className={`
              w-full font-medium mt-10.5 px-6 py-3 rounded-[14px] transition duration-200
              ${
                isButtonDisabled
                  ? "text-secondary-text bg-gray-300"
                  : "text-white bg-primary hover:bg-red-600 cursor-pointer"
              }
            `}
          >
            Finalizar y pagar
          </button>
        </div>
      </div>
    </form>
  );
}
