"use client";

import TextInput from "@/app/components/ui/TextInput";
import type { FormFields, FormErrors } from "@/hooks/useFormValidation";

type PersonalDataProps = {
  values: FormFields;
  errors: FormErrors;
  touched: Record<string, boolean | undefined>;
  onFieldChange: (field: keyof FormFields, value: string) => void;
  onFieldBlur: (field: keyof FormFields) => void;
};

export default function PersonalData({
  values,
  errors,
  touched,
  onFieldChange,
  onFieldBlur,
}: PersonalDataProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-5.5">
      <TextInput
        id="checkout-first-name"
        name="first_name"
        label="Nombre"
        placeholder="Tu nombre"
        autoComplete="given-name"
        value={values.first_name ?? ""}
        onChange={(e) => onFieldChange("first_name", e.target.value)}
        onBlur={() => onFieldBlur("first_name")}
        error={touched.first_name ? (errors.first_name ?? undefined) : undefined}
      />
      <TextInput
        id="checkout-last-name"
        name="last_name"
        label="Apellidos"
        placeholder="Tu apellido"
        autoComplete="family-name"
        value={values.last_name ?? ""}
        onChange={(e) => onFieldChange("last_name", e.target.value)}
        onBlur={() => onFieldBlur("last_name")}
        error={touched.last_name ? (errors.last_name ?? undefined) : undefined}
      />
      <TextInput
        id="checkout-email"
        name="email"
        label="Correo electrónico"
        placeholder="Tu correo electrónico"
        type="email"
        autoComplete="email"
        value={values.email ?? ""}
        onChange={(e) => onFieldChange("email", e.target.value)}
        onBlur={() => onFieldBlur("email")}
        error={touched.email ? (errors.email ?? undefined) : undefined}
      />
      <TextInput
        id="checkout-phone"
        name="phone"
        label="Teléfono"
        placeholder="+56"
        type="tel"
        autoComplete="tel"
        value={values.phone ?? ""}
        onChange={(e) => onFieldChange("phone", e.target.value)}
        onBlur={() => onFieldBlur("phone")}
        onFocus={() => {if (!values.phone) onFieldChange("phone", "+")}}
        error={touched.phone ? (errors.phone ?? undefined) : undefined}
      />
    </div>
  );
}
