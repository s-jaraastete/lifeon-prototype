"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { LuEllipsis, LuSearch } from "react-icons/lu";
import axiosManager from "@/lib/axios_manager";
import TextInput from "@/app/components/ui/TextInput";
import Spinner from "@/app/components/ui/Spinner";
import useDebounce from "@/hooks/useDebounce";
import { PaginatedResponse, Subscription, SubscriptionStatus } from "@/types/admin";
import { formatReferenceAmount } from "@/utils/pricingHelpers";
import SubscriptionDetailPanel from "./SubscriptionDetailPanel";

type SubscriptionsTableProps = {
  initialData: PaginatedResponse<Subscription> | null;
};

type StatusFilter = SubscriptionStatus | "free" | null;

const PAGE_SIZE = 10;

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "Todas", value: null },
  { label: "Activas", value: "active" },
  { label: "Suspendidas", value: "suspended" },
  { label: "Canceladas", value: "cancelled" },
];

const statusStyles: Record<SubscriptionStatus, string> = {
  pending_payment_method: "bg-yellow-100 text-yellow-800",
  pending_initial_payment: "bg-yellow-100 text-yellow-800",
  trialing: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  past_due: "bg-red-100 text-red-800",
  suspended: "bg-orange-100 text-orange-800",
  cancelled: "bg-gray-100 text-gray-800",
  expired: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<SubscriptionStatus, string> = {
  pending_payment_method: "Pendiente método de pago",
  pending_initial_payment: "Pendiente de pago inicial",
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pendiente",
  suspended: "Suspendida",
  cancelled: "Cancelada",
  expired: "Expirada",
  // plan_free: "Plan free",
};

const formatDate = (date: string | null) =>
  date ? new Date(date).toISOString().split("T")[0] : "—";

// TODO: Implementar esto con componentes reusable desarrollados en /admin/frontend (traer directorio)
export default function SubscriptionsTable({
  initialData,
}: SubscriptionsTableProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  useDebounce(
    () => {
      setDebouncedSearch(search);
      setPage(1);
    },
    700,
    [search]
  );

  const buildUrl = () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter === "free") {
      params.set("plan", "free");
    } else if (statusFilter) {
      params.set("status", statusFilter);
    }
    return `/admin-overview/subscriptions/?${params.toString()}`;
  };

  const { data, isLoading } = useQuery<PaginatedResponse<Subscription>>({
    queryKey: ["admin-subscriptions", { page, search: debouncedSearch, statusFilter }],
    queryFn: () =>
      axiosManager(buildUrl(), null, { method: "get", useAccessToken: true }),
    initialData:
      page === 1 && !debouncedSearch && !statusFilter
        ? initialData ?? undefined
        : undefined,
  });

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-neutral-primary">
          Todas las suscripciones
        </h2>
        {data && (
          <span className="text-sm text-neutral-secondary">
            {data.count} resultado{data.count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex justify-between">
        <div className="relative max-w-sm">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-tertiary" />
          <TextInput
            type="search"
            placeholder="Buscar por ID Suscripción, nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => {
                setStatusFilter(filter.value);
                setPage(1);
              }}
              className={clsx(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                statusFilter === filter.value
                  ? "bg-neutral-primary text-white"
                  : "bg-surface-secondary text-neutral-secondary hover:bg-stroke hover:text-neutral-primary"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>


      <div className="overflow-x-auto rounded-xl border border-stroke">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke bg-surface-secondary">
              <th className="px-4 py-3 text-left font-medium text-neutral-secondary">
                ID Suscripción
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-secondary">
                Cliente
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-secondary">
                Plan
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-secondary">
                Ciclo
              </th>
              <th className="px-4 py-3 text-right font-medium text-neutral-secondary">
                MRR
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-secondary">
                Fecha contrato
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-secondary">
                Fecha renovación
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-secondary">
                Método de cobro
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-secondary">
                Estado
              </th>
              <th className="px-4 py-3 text-right font-medium text-neutral-secondary">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <Spinner size="md" />
                </td>
              </tr>
            ) : data?.results.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center text-neutral-secondary"
                >
                  No se encontraron suscripciones
                </td>
              </tr>
            ) : (
              data?.results.map((sub) => (
                <tr
                  key={sub.subscription_id}
                  className="border-b border-stroke last:border-0 hover:bg-surface-secondary transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-neutral-primary">
                    {sub.subscription_id}
                  </td>
                  <td className="px-4 py-3 text-neutral-primary">
                    {sub.client_name}
                  </td>
                  <td className="px-4 py-3 text-neutral-primary">
                    {sub.pack_name_snapshot}
                  </td>
                  <td className="px-4 py-3 text-neutral-primary">
                    {sub.billing_period === "monthly" ? "Mensual" : "Anual"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-primary">
                    ${formatReferenceAmount(sub.mrr_clp)}
                  </td>
                  <td className="px-4 py-3 text-neutral-secondary">
                    {formatDate(sub.created)}
                  </td>
                  <td className="px-4 py-3 text-neutral-secondary">
                    {formatDate(sub.next_billing_at)}
                  </td>
                  <td className="px-4 py-3 text-neutral-secondary">
                    {sub.card_type || "Sin cobro"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusStyles[sub.status]
                      )}
                    >
                      {statusLabels[sub.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedSubscription(sub)}
                      className="rounded-lg p-1.5 text-neutral-secondary transition-colors hover:bg-surface-secondary hover:text-neutral-primary"
                    >
                      <LuEllipsis className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-secondary">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium text-neutral-primary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium text-neutral-primary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <SubscriptionDetailPanel
        subscription={selectedSubscription}
        onClose={() => setSelectedSubscription(null)}
      />
    </div>
  );
}
