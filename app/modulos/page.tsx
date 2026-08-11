import Link from 'next/link';
import BaseModules from './components/BaseModules';
import SpecializedModules from './components/SpecializedModules';
import BannerSection from '../components/shared/BannerSection';

const ModulosPage = () => {
  return (
    <div>
      <section className="w-full py-15 lg:py-25 px-4 xl:px-0">
        <div className="max-w-240 mx-auto flex flex-col items-center justify-center gap-5.5">
          <h1 className="text-3xl lg:text-5xl font-semibold text-base-black text-center leading-tight">
            Construye una plataforma que evoluciona junto a tu organización.
          </h1>
          <p className="lg:text-[22px] text-center text-base-black leading-tight">
            LifeOn está compuesto por módulos especializados que trabajan de
            forma integrada para ayudarte a gestionar la prevención de riesgos
            desde un solo lugar.
          </p>
          <div className="flex flex-col gap-2.5 lg:gap-4 mt-8 sm:flex-row">
            <Link href="/precios">
              <button className="w-full bg-secondary text-white py-3 rounded-xl hover:bg-teal-700 transition cursor-pointer sm:w-59.25">
                Ver planes
              </button>
            </Link>
            <Link href="/contacto">
              <button className="w-full border border-secondary text-secondary py-3 rounded-xl hover:bg-gray-300 transition cursor-pointer sm:w-59.25">
                Hablar con un asesor
              </button>
            </Link>
          </div>
        </div>
      </section>
      <BaseModules />
      <SpecializedModules />
      <BannerSection
        title={<>Empieza con la Plataforma Base. <br /> Crece a tu ritmo.</>}
        description="Todos los planes incluyen los módulos esenciales de LifeOn. A medida que tu organización evolucione, podrás activar nuevos módulos especializados sin cambiar de plataforma."
        buttonLabel="Ver planes"
        buttonUrl="/precios"
      />
    </div>
  );
};

export default ModulosPage;