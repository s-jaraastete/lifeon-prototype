import SubscriptionDashboard from "./components/SubscriptionDashboard";
import SubscriptionsTable from "./components/SubscriptionsTable";
import SubscriptionDetailProvider from "./components/detail/SubscriptionDetailProvider";
import TableFilters from "./components/TableFilters";


type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    pack_name_snapshot?: string;
    billing_period?: string;
    ordering?: string;
    created__gte?: string;
    created__lte?: string;
    next_billing_at__gte?: string;
    next_billing_at__lte?: string;
    mrr_clp__gte?: string;
    mrr_clp__lte?: string;
  }>;
};

const SuscripcionesPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;

  return (
    <SubscriptionDetailProvider>
      <div className="w-full mx-auto flex flex-col gap-4">
        <SubscriptionDashboard />
        <div className="rounded-2xl bg-surface-primary p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-neutral-primary">
                Todas las suscripciones
              </h2>
            </div>
            <TableFilters />
            <SubscriptionsTable params={params} />
          </div>
        </div>
      </div>
    </SubscriptionDetailProvider>
  );
};

export default SuscripcionesPage;
