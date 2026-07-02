"use client";

import { useState } from "react";
import TextInput from "@/app/components/ui/TextInput";
import useFormValidation from "@/hooks/useFormValidation";
import type { FormFields } from "@/hooks/useFormValidation";

type Touched = Record<keyof FormFields, boolean>;

export default function PersonalData() {
  const [form, setForm] = useState<FormFields>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [touched, setTouched] = useState<Touched>({
    name: false,
    first_name: false,
    last_name: false,
    email: false,
    phone: false,
  });

  const { errors, validate } = useFormValidation(form);

  const updateField = (field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof FormFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  return (
    <form className="grid lg:grid-cols-2 gap-5.5">
      <TextInput
        id="checkout-first-name"
        label="Nombre"
        placeholder="Tu nombre"
        autoComplete="given-name"
        value={form.first_name}
        onChange={(e) => updateField("first_name", e.target.value)}
        onBlur={() => handleBlur("first_name")}
        error={touched.first_name ? errors.first_name ?? undefined : undefined}
      />
      <TextInput
        id="checkout-last-name"
        label="Apellidos"
        placeholder="Tu apellido"
        autoComplete="family-name"
        value={form.last_name}
        onChange={(e) => updateField("last_name", e.target.value)}
        onBlur={() => handleBlur("last_name")}
        error={touched.last_name ? errors.last_name ?? undefined : undefined}
      />
      <TextInput
        id="checkout-email"
        label="Correo electrónico"
        placeholder="Tu correo electrónico"
        type="email"
        autoComplete="email"
        value={form.email}
        onChange={(e) => updateField("email", e.target.value)}
        onBlur={() => handleBlur("email")}
        error={touched.email ? errors.email ?? undefined : undefined}
      />
      <TextInput
        id="checkout-phone"
        label="Teléfono"
        placeholder="+56"
        type="tel"
        autoComplete="tel"
        value={form.phone}
        onChange={(e) => updateField("phone", e.target.value)}
        onBlur={() => handleBlur("phone")}
        error={touched.phone ? errors.phone ?? undefined : undefined}
      />
    </form>
  );
}
