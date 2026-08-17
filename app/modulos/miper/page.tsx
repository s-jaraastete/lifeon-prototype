import ModuleHero from "./components/ModuleHero";
import InfoCardsSection from "@/app/components/shared/InfoCardsSection";
import BannerSection from "@/app/components/shared/BannerSection";
import FrequentlyQuestions from "@/app/components/shared/FrequentlyQuestions";

import infoCardsData from "./data/infoCardsData";
import frequentlyQuestions from "@/app/components/landing/data/frequentlyQuestions";

const MiperPage = () => {
  return (
    <>
      <ModuleHero />
      <InfoCardsSection
        title={<>Una forma <span className="text-secondary">más eficiente</span> de gestionar tu Matriz IPER</>}
        description="Centraliza la identificación de peligros, la evaluación de riesgos y el seguimiento de las medidas de control en una plataforma diseñada para mantener la información organizada, actualizada y disponible para toda la organización."
        cardsData={infoCardsData}
      />
      {/* TODO: Componentes restantes */}
      <FrequentlyQuestions
        title="Preguntas frecuentes"
        description="Resolvemos las consultas más comunes sobre el módulo MIPER, su implementación y su funcionamiento dentro de la plataforma LifeOn."
        items={frequentlyQuestions}
      />
      <BannerSection
        title="¿Listo para implementar MIPER en tu organización?"
        description="Prueba gratis el módulo Matriz IPER incorporado en el Paquete Base Esencial durante 30 días. "
        image="/images/banner-notebook-2.png"
        textColor="dark"
        buttonUrl="/precios"
      />
    </>
  );
};

export default MiperPage;
