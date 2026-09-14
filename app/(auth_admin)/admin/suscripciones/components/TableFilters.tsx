"use client";

import MoreFilters from "./filters/MoreFilters";
import SearchInput from "@/app/(auth_admin)/admin/components/shared/SearchInput";
import StatusTabs, {
  type StatusTab,
} from "@/app/(auth_admin)/admin/components/shared/StatusTabs";

const statusTabs: StatusTab[] = [
  { label: "Todas", value: null },
  { label: "Activas", value: "active" },
  { label: "Suspendidas", value: "suspended" },
  { label: "Canceladas", value: "cancelled" },
  { label: "Vencidas", value: "past_due" },
  // { label: "Pendientes", value: "pending_payment_method" },
];

const TableFilters = () => {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
      <SearchInput placeholder="Buscar por ID Suscripción, nombre..." />
      <div className="flex items-center gap-3 flex-wrap">
        <StatusTabs tabs={statusTabs} />
        <MoreFilters />
      </div>
    </div>
  );
};

export default TableFilters;
