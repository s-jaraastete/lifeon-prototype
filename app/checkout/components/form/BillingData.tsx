"use client";

import TextInput from "@/app/components/ui/TextInput";
import Listbox from "@/app/components/ui/Listbox";
import type { FormFields, FormErrors } from "@/hooks/useFormValidation";

const COMUNA_OPTIONS = [
  { value: "131", label: "Santiago centro" },
  { value: "55", label: "Valparaíso" },
  { value: "81", label: "Concepción" },
];

type BillingDataProps = {
  regions: Region[];
  values: FormFields;
  errors: FormErrors;
  touched: Record<string, boolean | undefined>;
  onFieldChange: (field: keyof FormFields, value: string) => void;
  onFieldBlur: (field: keyof FormFields) => void;
};

export default function BillingData({
  regions,
  values,
  errors,
  touched,
  onFieldChange,
  onFieldBlur,
}: BillingDataProps) {

  const regionOptions = regions.map((r) => ({
    value: String(r.id),
    label: r.name,
  }));

  return (
    <div className="grid lg:grid-cols-2 gap-5.5">
      <TextInput
        id="checkout-rut"
        label="Rut empresa"
        placeholder="Rut empresa"
        value={values.rut ?? ""}
        onChange={(e) => onFieldChange("rut", e.target.value)}
        onBlur={() => onFieldBlur("rut")}
        error={touched.rut ? (errors.rut ?? undefined) : undefined}
      />
      <TextInput
        id="checkout-business-name"
        label="Razón social"
        placeholder="Razón social empresa"
        autoComplete="organization"
        value={values.business_name ?? ""}
        onChange={(e) => onFieldChange("business_name", e.target.value)}
        onBlur={() => onFieldBlur("business_name")}
        error={
          touched.business_name
            ? (errors.business_name ?? undefined)
            : undefined
        }
      />
      <TextInput
        id="checkout-business-line"
        label="Giro comercial"
        placeholder="Giro comercial empresa"
        value={values.business_line ?? ""}
        onChange={(e) => onFieldChange("business_line", e.target.value)}
        onBlur={() => onFieldBlur("business_line")}
        error={
          touched.business_line
            ? (errors.business_line ?? undefined)
            : undefined
        }
      />
      <TextInput
        id="checkout-billing-email"
        label="Correo electrónico"
        placeholder="Correo electrónico"
        type="email"
        autoComplete="email"
        value={values.billing_email ?? ""}
        onChange={(e) => onFieldChange("billing_email", e.target.value)}
        onBlur={() => onFieldBlur("billing_email")}
        error={
          touched.billing_email
            ? (errors.billing_email ?? undefined)
            : undefined
        }
      />
      <div className="lg:col-span-2">
        <TextInput
          id="checkout-address"
          label="Dirección"
          placeholder="Dirección legal"
          autoComplete="street-address"
          value={values.address ?? ""}
          onChange={(e) => onFieldChange("address", e.target.value)}
          onBlur={() => onFieldBlur("address")}
          error={
            touched.address ? (errors.address ?? undefined) : undefined
          }
        />
      </div>
      <Listbox
        id="checkout-region"
        label="Región"
        placeholder="Selecciona una región"
        options={regionOptions}
        value={values.region ?? ""}
        onValueChange={(v) => onFieldChange("region", v)}
        onFocus={() => onFieldBlur("region")}
        error={touched.region ? (errors.region ?? undefined) : undefined}
      />
      <Listbox
        id="checkout-comuna"
        label="Comuna o ciudad"
        placeholder="Selecciona una comuna"
        options={COMUNA_OPTIONS}
        value={values.comuna ?? ""}
        onValueChange={(v) => onFieldChange("comuna", v)}
        onFocus={() => onFieldBlur("comuna")}
        error={touched.comuna ? (errors.comuna ?? undefined) : undefined}
      />
    </div>
  );
}
