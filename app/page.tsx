import AssociatedCompanies from "./components/landing/AssociatedCompanies";
import BannerSection from "./components/landing/BannerSection";
import PlansPricing from "./components/shared/PlansPricing";
import Comments from "./components/landing/Comments";
import ContactSection from "./components/landing/ContactSection";
import frequentlyQuestions from "./components/landing/data/frequentlyQuestions";
import FrequentlyQuestions from "./components/landing/FrequentlyQuestions";
import HeroSection from "./components/landing/HeroSection";
import InfoPack from "./components/landing/InfoPack";
import ManagementMap from "./components/landing/ManagementMap";

import { getServerData } from "@/lib/requests";


const HomePage = async () => {
  let allSlots: unknown[] = [];

  // Schedule Data
  /* try {
    const scheduleResponse = await getServerData("/timeslots/", {
      useAccessToken: false,
      cache: "no-store"
    });

    allSlots = Array.isArray(response) ? scheduleResponse : [];
  } catch {
    allSlots = [];
  } */

  // Plans Data
  const plansResponse = await getServerData("/packs/all/", {
      useAccessToken: false,
      cache: "no-store"
    });

  const plansData: Pack[] = plansResponse.data.results

  return (
    <>
      <HeroSection />
      <AssociatedCompanies />
      <ManagementMap />
      <PlansPricing plans={plansData} />
      <InfoPack />
      <BannerSection />
      <Comments />
      <FrequentlyQuestions items={frequentlyQuestions} />
      <ContactSection 
        allSlots={allSlots} 
        title="Lleva la seguridad de tu empresa al siguiente nivel"
        description="¿Tienes dudas sobre cómo implementar el Paquete Base o los próximos módulos especializados? Elige el día y la hora que más te acomoden para una videollamada personalizada con nuestro equipo."
      />
    </>
  );
};

export default HomePage;