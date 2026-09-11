"use client";

import FilterDropdown, {
  type FilterGroup,
  type OrderingConfig,
} from "@/app/(auth_admin)/admin/components/shared/FilterDropdown";

const planOptions = [
  { value: "Starter", label: "Starter" },
  { value: "Business", label: "Business" },
  { value: "Free", label: "Free" },
  { value: "Customizado", label: "Customizado" },
];

const cycleOptions = [
  { value: "", label: "Todos" },
  { value: "monthly", label: "Mensual" },
  { value: "yearly", label: "Anual" },
];

const orderingFieldOptions = [
  { value: "", label: "Por defecto" },
  { value: "company__name", label: "Cliente" },
  { value: "mrr_clp", label: "MRR" },
  { value: "created", label: "Fecha creación" },
  { value: "next_billing_at", label: "Fecha renovación" },
];

const orderingConfig: OrderingConfig = {
  options: orderingFieldOptions,
  defaultDescFields: ["created", "next_billing_at", "mrr_clp"],
};

const groups: FilterGroup[] = [
  {
    type: "select",
    label: "Plan",
    param: "pack_name_snapshot",
    options: planOptions,
    multiple: true,
  },
  {
    type: "select",
    label: "Ciclo",
    param: "billing_period",
    options: cycleOptions,
  },
  {
    type: "number-range",
    label: "MRR (CLP)",
    base: "mrr_clp",
    ariaLabels: ["MRR desde", "MRR hasta"],
  },
  {
    type: "date-range",
    label: "Fecha contrato",
    base: "created",
    ariaLabels: ["Fecha contrato desde", "Fecha contrato hasta"],
  },
  {
    type: "date-range",
    label: "Fecha renovación",
    base: "next_billing_at",
    ariaLabels: ["Fecha renovación desde", "Fecha renovación hasta"],
  },
];

const MoreFilters = () => (
  <FilterDropdown ordering={orderingConfig} groups={groups} />
);

export default MoreFilters;
