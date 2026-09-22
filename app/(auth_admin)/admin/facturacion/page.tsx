import InvoiceDashboard from "./components/InvoiceDashboard";
import InvoicesTable from "./components/InvoicesTable";
import InvoiceDetailProvider from "./components/detail/InvoiceDetailProvider";
import TableFilters from "./components/TableFilters";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    ordering?: string;
    issued_at__gte?: string;
    issued_at__lte?: string;
    due_date__gte?: string;
    due_date__lte?: string;
    total_amount_clp__gte?: string;
    total_amount_clp__lte?: string;
  }>;
};

const InvoicePage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;

  return (
    <InvoiceDetailProvider>
      <div className="w-full mx-auto flex flex-col gap-4">
        <InvoiceDashboard />
        <div className="rounded-2xl bg-surface-primary p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-neutral-primary">
                Todas las facturas
              </h2>
            </div>
            <TableFilters />
            <InvoicesTable params={params} />
          </div>
        </div>
      </div>
    </InvoiceDetailProvider>
  );
};

export default InvoicePage;
