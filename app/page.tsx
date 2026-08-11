import HeroSection from "./components/landing/HeroSection";
import AssociatedCompanies from "./components/landing/AssociatedCompanies";
import ManagementMap from "./components/landing/ManagementMap";
import InfoPack from "./components/landing/InfoPack";
import Comments from "./components/landing/Comments";
import InfoCardsSection from "./components/shared/InfoCardsSection";
import PlansPricing from "./components/shared/PlansPricing";
import BannerSection from "./components/shared/BannerSection";
import ContactSection from "./components/shared/ContactSection";
import FrequentlyQuestions from "./components/shared/FrequentlyQuestions";

import frequentlyQuestions from "./components/landing/data/frequentlyQuestions";
import infoCardsData from "./components/landing/data/infoCardsData";

import { getServerData } from "@/lib/requests";


const HomePage = async () => {
  let allSlots: unknown[] = [];
  let plansData: Pack[] = [];

  // Schedule Data
  /* try {
    const scheduleResponse = await getServerData("/timeslots/", {
      useAccessToken: false,
      cache: "no-store"
    });

    allSlots = Array.isArray(scheduleResponse) ? scheduleResponse : [];
  } catch {
    allSlots = [];
  } */

  // Plans Data
  try {
    const plansResponse = await getServerData("/packs/all/", {
      useAccessToken: false,
      cache: "no-store",
    });

    plansData = plansResponse?.data?.results ?? [];
  } catch {
    plansData = [];
  }

  return (
    <>
      <HeroSection />
      <AssociatedCompanies />
      <InfoCardsSection
        title={<><span className="text-secondary">Más control</span>, menos carga y mejores decisiones.</>}
        cardsData={infoCardsData}
      />
      <ManagementMap />
      <PlansPricing plans={plansData} />
      <InfoPack />
      <BannerSection
        title="Crece junto a tu organización"
        description="LifeOn evoluciona contigo. Incorpora nuevas herramientas sin cambiar de plataforma ni migrar tu información."
        buttonUrl="/precios"
      />
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