import { InvoiceDashboardOverview } from "@/types/admin";
import { getServerData } from "@/lib/requests";
import InvoiceDashboard from "./components/InvoiceDashboard";
import InvoicesTable from "./components/InvoicesTable";
import InvoiceDetailProvider from "./components/detail/InvoiceDetailProvider";
import TableFilters from "./components/TableFilters";
import ExportTableButton from "../components/ExportTableButton";

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

const buildInvoicesExportFilename = () => {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `facturas_${date}.xlsx`;
};

const InvoicePage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const exportFilename = buildInvoicesExportFilename();
  let data: InvoiceDashboardOverview | null = null;

  try {
    const dashboardResponse = await getServerData(
      "/admin-overview/invoices/dashboard/",
      {
        useAccessToken: true,
        cache: "no-store",
      }
    );
    data = dashboardResponse?.data ?? null;
  } catch {
    data = null;
  }

  return (
    <InvoiceDetailProvider>
      <div className="w-full mx-auto flex flex-col gap-4">
        {data && <InvoiceDashboard data={data} />}
        <div className="rounded-2xl bg-surface-primary p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-neutral-primary">
                Todas las facturas
              </h2>
              <ExportTableButton
                endpoint="/admin-overview/invoices/export/"
                queryParams={params}
                downloadFilename={exportFilename}
              />
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
