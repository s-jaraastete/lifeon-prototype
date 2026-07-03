"use client";

import { useState } from "react";
import CheckoutCollapse from "./CheckoutCollapse";
import PersonalData from "./PersonalData";
import BillingData from "./BillingData";
import PaymentMethod from "./PaymentMethod";
import useFormValidation from "@/hooks/useFormValidation";
import type { FormFields } from "@/hooks/useFormValidation";

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

export default function CheckoutSections() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(
    "personal",
  );

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

  const isBillingUnlocked = isPersonalCompleted;
  const isPaymentUnlocked = isBillingCompleted;

  return (
    <div className="flex flex-col gap-5.5">
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
        locked={!isPaymentUnlocked}
      >
        <PaymentMethod />
      </CheckoutCollapse>
    </div>
  );
}
