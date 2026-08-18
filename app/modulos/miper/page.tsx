import ModuleHero from "./components/ModuleHero";
import InfoCardsSection from "@/app/components/shared/InfoCardsSection";
import BannerSection from "@/app/components/shared/BannerSection";
import FrequentlyQuestions from "@/app/components/shared/FrequentlyQuestions";
import EcoSystemSection from "../components/EcoSystemSection";
import WorkFlowMiperSection from "./components/WorkFlowMiperSection";

import infoCardsData from "./data/infoCardsData";
import frequentlyQuestionsMiper from "./data/frequentlyQuestionsMiper";

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
      <WorkFlowMiperSection />
      <EcoSystemSection
        title={<>Matriz IPER es parte de un <span className="text-secondary">ecosistema</span> conectado</>}
        description="Aunque el módulo MIPER puede utilizarse de forma independiente, alcanza su máximo potencial cuando se integra con otros módulos de LifeOn. La información fluye entre procesos, evitando duplicidad de registros y facilitando una gestión preventiva más completa."
        image="/images/ecosistema-section.png"
      />
      <FrequentlyQuestions
        title="Preguntas frecuentes"
        description="Resolvemos las consultas más comunes sobre el módulo MIPER, su implementación y su funcionamiento dentro de la plataforma LifeOn."
        items={frequentlyQuestionsMiper}
      />
      <BannerSection
        title="¿Listo para implementar MIPER en tu organización?"
        description="Prueba gratis el módulo Matriz IPER incorporado en el Plan Free de LifeOn. "
        image="/images/banner-notebook-2.png"
        textColor="dark"
        buttonUrl="/precios"
      />
    </>
  );
};

export default MiperPage;
