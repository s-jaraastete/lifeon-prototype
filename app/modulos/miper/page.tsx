import Link from "next/link";
import InfoCardsSection from "@/app/components/shared/InfoCardsSection";
import FrequentlyQuestions from "@/app/components/shared/FrequentlyQuestions";
import infoCardsData from "./data/infoCardsData";
import frequentlyQuestions from "@/app/components/landing/data/frequentlyQuestions";
import BannerSection from "@/app/components/shared/BannerSection";

const MiperPage = () => {
  return (
    <div>
      <section className="w-full py-15 lg:py-25 px-4 xl:px-0">
        <div className="max-w-240 mx-auto flex flex-col items-center justify-center gap-5.5">
          <h1 className="text-3xl lg:text-5xl font-semibold text-base-black text-center leading-tight">
            Gestiona tu Matriz IPER de forma centralizada y conforme al DS44
          </h1>
          <p className="lg:text-[22px] text-center text-base-black leading-tight">
            El módulo MIPER permite identificar peligros, evaluar riesgos, definir
            medidas de control y mantener un registro actualizado de toda la
            gestión preventiva. Diseñado para facilitar el cumplimiento normativo
            y entregar trazabilidad en cada etapa del proceso.
          </p>
          <div className="flex flex-col gap-2.5 lg:gap-4 mt-8 sm:flex-row">
            <Link href="/precios">
              <button className="w-full bg-secondary text-white py-3 rounded-xl hover:bg-teal-700 transition cursor-pointer sm:w-59.25">
                Comienza gratis ahora
              </button>
            </Link>
            <Link href="/contacto">
              <button className="w-full border border-secondary text-secondary py-3 rounded-xl hover:bg-gray-300 transition cursor-pointer sm:w-59.25">
                Hablar con un asesor
              </button>
            </Link>
          </div>
        </div>
        {/* TODO: Agregar Imagen */}
      </section>
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
    </div>
  );
};

export default MiperPage;
