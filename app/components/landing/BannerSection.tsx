import Image from 'next/image';
import StartTrialButton from '../shopping/StartTrialButton';

// Icons
import { LuChevronRight } from 'react-icons/lu';


const BannerSection = () => {
  return (
    <section className="w-full py-15">
      <div className="max-w-325 mx-auto">
        <div className="relative w-full h-60 sm:h-72 md:h-80 lg:h-96 overflow-hidden">
          <Image
            src="/images/banner-notebook.png"
            alt="Banner"
            width={1300}
            height={600}
            className="object-cover"
          />

          <div className="absolute inset-0 p-10 flex flex-col justify-between">
            <div className="w-160 flex flex-col gap-2.5">
              <h3 className="text-4xl sm:text-4xl md:text-5xl font-semibold text-white leading-tight">
                Comienza tu mes de <br /> prueba sin costo.
              </h3>
              <p className="text-lg text-white">
                Prueba LifeOn durante 30 días. Al finalizar el período de prueba, continuarás con la suscripción seleccionada pagando únicamente el valor del paquete contratado.
              </p>
            </div>
            <div>
              <StartTrialButton
                slug="paquete-base-esencial"
                className=" bg-white px-6 py-3 rounded-xl hover:bg-gray-200 transition cursor-pointer flex items-center"
                pendingText="Preparando prueba..."
              >
                Comienza ahora
                <LuChevronRight size={20} className="inline-block ml-2 text-black" />
              </StartTrialButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
};

export default BannerSection;