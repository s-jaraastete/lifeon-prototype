"use client";

import { useEffect, useState } from "react";
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

export default function CheckoutSections() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(
    "personal",
  );

  const [form, setForm] = useState<FormFields>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { errors, validate } = useFormValidation(form);

  const handleFieldChange = (field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
  };

  const handleFieldBlur = (field: keyof FormFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  // Re-validate on form change so errors clear as the user types
  useEffect(() => {
    validate();
  }, [form, validate]);

  const toggle = (section: SectionId) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const isPersonalCompleted = PERSONAL_FIELDS.every(
    (f) => touched[f] && errors[f] == null,
  );
  const isBillingUnlocked = isPersonalCompleted;

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
        locked={!isBillingUnlocked}
      >
        <BillingData />
      </CheckoutCollapse>

      <CheckoutCollapse
        title="Método de pago"
        active={activeSection === "payment"}
        onToggle={() => toggle("payment")}
        locked
      >
        <PaymentMethod />
      </CheckoutCollapse>
    </div>
  );
}
