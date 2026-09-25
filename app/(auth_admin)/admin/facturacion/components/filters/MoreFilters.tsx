"use client";

import FilterDropdown, {
  type FilterGroup,
  type OrderingConfig,
} from "@/app/(auth_admin)/admin/components/shared/FilterDropdown";

const orderingFieldOptions = [
  { value: "", label: "Por defecto" },
  { value: "company_name_snapshot", label: "Cliente" },
  { value: "total_amount_clp", label: "Monto" },
  { value: "issued_at", label: "Fecha emisión" },
  { value: "due_date", label: "Fecha vencimiento" },
];

const orderingConfig: OrderingConfig = {
  options: orderingFieldOptions,
  defaultField: "issued_at",
  defaultDescFields: ["issued_at", "due_date", "total_amount_clp"],
};

const groups: FilterGroup[] = [
  {
    type: "number-range",
    label: "Monto (CLP)",
    base: "total_amount_clp",
    ariaLabels: ["Monto desde", "Monto hasta"],
  },
  {
    type: "date-range",
    label: "Fecha emisión",
    base: "issued_at",
    ariaLabels: ["Fecha emisión desde", "Fecha emisión hasta"],
  },
  {
    type: "date-range",
    label: "Fecha vencimiento",
    base: "due_date",
    ariaLabels: ["Fecha vencimiento desde", "Fecha vencimiento hasta"],
  },
];

const MoreFilters = () => (
  <FilterDropdown ordering={orderingConfig} groups={groups} />
);

export default MoreFilters;
