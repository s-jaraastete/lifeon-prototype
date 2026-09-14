"use client";

import SearchInput from "@/app/(auth_admin)/admin/components/shared/SearchInput";
import StatusTabs, {
  type StatusTab,
} from "@/app/(auth_admin)/admin/components/shared/StatusTabs";
import MoreFilters from "./filters/MoreFilters";

// TODO: Valores del endpoint de suscripciones mientras no exista el de facturación.
const statusTabs: StatusTab[] = [
  { label: "Todas", value: null },
  { label: "Pagadas", value: "active" },
  { label: "Pendientes", value: "pending_payment_method" },
  { label: "Vencidas", value: "past_due" },
];

const TableFilters = () => {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
      <SearchInput placeholder="Buscar por ID Factura, nombre cliente, rut, ID Suscripción..." />
      <div className="flex items-center gap-3 flex-wrap">
        <StatusTabs tabs={statusTabs} />
        <MoreFilters />
      </div>
    </div>
  );
};

export default TableFilters;
