import { getServerData } from "@/lib/requests";
import { PaginatedResponse, Subscription } from "@/types/admin";
import SubscriptionsTable from "./components/SubscriptionsTable";
import SubscriptionDashboard from "./components/SubscriptionDashboard";

const SuscripcionesPage = async () => {
  let initialData: PaginatedResponse<Subscription> | null = null;

  try {
    const response = await getServerData(
      "/admin-overview/subscriptions/?page=1&page_size=10",
      {
        useAccessToken: true,
        cache: "no-store",
      }
    );
    initialData = response?.data ?? null;
  } catch {
    initialData = null;
  }

  return (
    <div className="w-full mx-auto flex flex-col gap-4">
      <SubscriptionDashboard />
      <div className="rounded-2xl bg-surface-primary p-6">
        <SubscriptionsTable initialData={initialData} />
      </div>
    </div>
  );
};

export default SuscripcionesPage;
