import BillingDashboard from "./components/BillingDashboard";
import BillingTable from "./components/BillingTable";
import BillingDetailProvider from "./components/detail/BillingDetailProvider";
import TableFilters from "./components/TableFilters";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    ordering?: string;
    created__gte?: string;
    created__lte?: string;
    next_billing_at__gte?: string;
    next_billing_at__lte?: string;
    mrr_clp__gte?: string;
    mrr_clp__lte?: string;
  }>;
};

const BillingPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;

  return (
    <BillingDetailProvider>
      <div className="w-full mx-auto flex flex-col gap-4">
        <BillingDashboard />
        <div className="rounded-2xl bg-surface-primary p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-neutral-primary">
                Todas las facturas
              </h2>
            </div>
            <TableFilters />
            <BillingTable params={params} />
          </div>
        </div>
      </div>
    </BillingDetailProvider>
  );
};

export default BillingPage;
