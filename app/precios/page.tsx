import ContactSection from "../components/landing/ContactSection";
import frequentlyQuestions from "../components/landing/data/frequentlyQuestions";
import FrequentlyQuestions from "../components/landing/FrequentlyQuestions";
import PlansPricing from "../components/shared/PlansPricing";
import PlanComparisonTable from "../components/shared/PlanComparisonTable";

const PreciosPage = () => {
  const allSlots: unknown[] = [];

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
      <PlansPricing compact />
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
