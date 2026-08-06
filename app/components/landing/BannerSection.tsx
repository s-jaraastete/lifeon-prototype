import Image from 'next/image';
// import StartTrialButton from '../shopping/StartTrialButton';

// Icons
import { LuChevronRight } from 'react-icons/lu';


const BannerSection = () => {
  return (
    <section className="w-full py-5 lg:py-15 px-4 xl:px-0">
      <div className="max-w-325 mx-auto">
        <div className="relative w-full h-40 sm:h-72 md:h-80 lg:h-96 rounded-[22px] overflow-hidden">
          <Image
            src="/images/banner-notebook.png"
            alt="Banner"
            width={1300}
            height={600}
            className="h-full object-cover"
          />

          <div className="absolute inset-0 p-5 md:p-8 lg:p-10 flex flex-col justify-between">
            <div className="w-160 flex flex-col gap-2.5">
              <h2 className="text-2xl lg:text-4xl sm:text-4xl md:text-5xl font-semibold text-white leading-tight">
                Crece junto a tu <br /> organización
              </h2>
              <p className="hidden lg:block lg:text-lg text-white">
                LifeOn evoluciona contigo. Incorpora nuevas herramientas sin cambiar de plataforma ni migrar tu información.
              </p>
            </div>
            <div className="flex">
              {/* <StartTrialButton
                slug="paquete-base-esencial"
                className="text-white sm:text-black sm:bg-white sm:px-6 py-3 rounded-xl sm:hover:bg-gray-300 transition cursor-pointer flex items-center w-full"
                pendingText="Preparando prueba..."
              >
                Comienza ahora
                <LuChevronRight
                  size={20}
                  className="inline-block sm:ml-2 sm:text-black"
                />
              </StartTrialButton> */}
              <button className="text-white sm:text-black sm:bg-white sm:px-6 py-3 rounded-xl sm:hover:bg-gray-300 transition cursor-pointer flex items-center">
                Comienza ahora
                <LuChevronRight
                  size={20}
                  className="inline-block sm:ml-2 sm:text-black"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
};

export default BannerSection;