"use client";

import FilterDropdown, {
  type FilterGroup,
  type OrderingConfig,
} from "@/app/(auth_admin)/admin/components/shared/FilterDropdown";

const orderingFieldOptions = [
  { value: "", label: "Por defecto" },
  { value: "company__name", label: "Cliente" },
  { value: "mrr_clp", label: "Monto" },
  { value: "created", label: "Fecha emisión" },
  { value: "next_billing_at", label: "Fecha vencimiento" },
];

const orderingConfig: OrderingConfig = {
  options: orderingFieldOptions,
  defaultDescFields: ["created", "next_billing_at", "mrr_clp"],
};

const groups: FilterGroup[] = [
  {
    type: "number-range",
    label: "Monto (CLP)",
    base: "mrr_clp",
    ariaLabels: ["Monto desde", "Monto hasta"],
  },
  {
    type: "date-range",
    label: "Fecha emisión",
    base: "created",
    ariaLabels: ["Fecha emisión desde", "Fecha emisión hasta"],
  },
  {
    type: "date-range",
    label: "Fecha vencimiento",
    base: "next_billing_at",
    ariaLabels: ["Fecha vencimiento desde", "Fecha vencimiento hasta"],
  },
];

const MoreFilters = () => (
  <FilterDropdown ordering={orderingConfig} groups={groups} />
);

export default MoreFilters;
