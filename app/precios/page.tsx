import PlansPricing from "../components/shared/PlansPricing";
import { getServerData } from "@/lib/requests";


const PreciosPage = async () => {
  const plansResponse = await getServerData("/packs/all/", {
        useAccessToken: false,
        cache: "no-store"
      });
  
  const plansData: Pack[] = plansResponse.data.results

  return (
    <div className="w-full">
      <PlansPricing plans={plansData} />
    </div>
  );
};

export default PreciosPage;
