import { SubscriptionDashboardOverview } from "@/types/admin";
import { getServerData } from "@/lib/requests";
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
    ai__pack_name_snapshot?: string;
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
  let data: SubscriptionDashboardOverview | null = null;

  try {
    const dashboardResponse = await getServerData("/admin-overview/subscriptions/dashboard/", {
      useAccessToken: true,
      cache: "no-store",
    });
    data = dashboardResponse?.data ?? null;
  } catch {
    data = null;
  }


  return (
    <SubscriptionDetailProvider>
      <div className="w-full mx-auto flex flex-col gap-4">
        {data && <SubscriptionDashboard data={data} />}
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
