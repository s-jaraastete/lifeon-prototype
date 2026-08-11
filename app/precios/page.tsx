import PlansPricing from "../components/shared/PlansPricing";
import ContactSection from "../components/shared/ContactSection";
import FrequentlyQuestions from "../components/shared/FrequentlyQuestions";
import frequentlyQuestions from "../components/landing/data/frequentlyQuestions";
import PlanComparisonTable from "./components/PlanComparisonTable";
import { getServerData } from "@/lib/requests";


const PreciosPage = async () => {
  const allSlots: unknown[] = [];
  let plansData: Pack[] = [];

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
    <div className="w-full">
      <section className="w-full pt-15 lg:pt-25 px-4 xl:px-0">
        <div className="max-w-240 mx-auto flex flex-col items-center justify-center gap-5.5">
          <h1 className="text-3xl lg:text-5xl font-semibold text-base-black text-center leading-tight">
            Elige el plan que mejor se adapte a tu organización
          </h1>
          <p className="lg:text-[22px] text-center text-base-black leading-tight">
            Los planes de LifeOn evolucionan junto a las necesidades de tu
            organización. Desde una versión inicial para comenzar a
            digitalizarte hasta una plataforma completa con herramientas
            avanzadas y módulos especializados.
          </p>
        </div>
      </section>
      <PlansPricing plans={plansData} compact />
      <PlanComparisonTable />
      <FrequentlyQuestions
        items={frequentlyQuestions}
        title="Preguntas frecuentes"
      />
      <ContactSection
        allSlots={allSlots}
        title="¿No sabes qué plan elegir?"
        description="Nuestro equipo puede ayudarte a identificar el plan ideal según el tamaño y las necesidades de tu organización."
      />
    </div>
  );
};

export default PreciosPage;
