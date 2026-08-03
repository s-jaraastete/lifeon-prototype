"use client";

import Image from 'next/image';
import Link from 'next/link';

import HeroSlider from './HeroSlider';
import ModuleCardsRow from './ModuleCardsRow';
import StartTrialButton from '../shopping/StartTrialButton';


const HeroSection = () => {
  const slides = [
    {
      id: 1,
      content: (
        <div className="flex items-center w-full h-full lg:min-h-[calc(100vh-70px)] overflow-hidden">
          <div className="relative z-10 lg:grid grid-cols-2 h-full max-w-325 mx-auto items-center pt-4 pb-18 lg:pb-0">
            <div className="px-4 xl:px-0">
              <div className="flex flex-col gap-5.5 lg:gap-4">
                <h1 className="text-[30px] font-semibold leading-tight md:text-5xl lg:text-6xl text-base-black">
                  Gestión de riesgos inteligente, accesible y 100% auditable.
                </h1>
                <p className="text-lg text-primary-text leading-6 md:text-[22px] md:leading-7">
                  Estandariza la seguridad de tu empresa. Adopta los altos
                  estándares de la industria en una plataforma intuitiva que
                  evoluciona con tu negocio, activando soluciones a tu propio
                  ritmo.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 lg:gap-4 mt-10 sm:flex-row">
                <StartTrialButton
                  slug="paquete-base-esencial"
                  className="w-full bg-secondary text-white py-3 rounded-xl hover:bg-teal-700 transition cursor-pointer sm:w-59.25"
                  pendingText="Preparando prueba..."
                >
                  Iniciar prueba gratuita 🚀
                </StartTrialButton>
                <Link href="/modulos">
                  <button className="w-full border border-secondary text-secondary py-3 rounded-xl hover:bg-gray-300 transition cursor-pointer sm:w-59.25">
                    Conocer módulos
                  </button>
                </Link>
              </div>
            </div>
            <div />
          </div>
          <div className="pointer-events-none absolute left-[48%] top-1/2 hidden w-[clamp(54rem,58vw,120rem)] translate-y-[-53%] lg:block lg:left-[50%] xl:left-[58%]">
            <Image
              src="/images/hero-section-1.png"
              alt="Hero Section 1"
              width={2000}
              height={1200}
              priority
              className="h-auto w-full max-w-none"
            />
          </div>
        </div>
      ),
    },

    {
      id: 2,
      content: (isActive: boolean) => (
        <div className="flex flex-col max-w-325 mx-auto items-center justify-center lg:h-full px-4 xl:px-0 pt-4 pb-18 lg:pb-0">
          <div className="flex flex-col items-center justify-center gap-7.5 group">
            <ModuleCardsRow isActive={isActive} />
            <div className="flex flex-col gap-5.5 lg:gap-4 items-center w-full lg:w-260">
              <h2 className="text-[30px] font-semibold leading-tight lg:text-center md:text-5xl lg:text-6xl lg:w-220 text-base-black">
                Software modular: Comienza hoy con nuestro{" "}
                <span className="text-secondary">Paquete Base Esencial</span>
              </h2>
               <p className="text-lg text-primary-text leading-6 lg:text-center md:text-[22px] md:leading-7">
                Digitaliza tu prevención de riesgos con tres herramientas
                robustas e integradas: MIPER, Control Documental y Asistente
                Virtual de Prevención. Una solución potente que mantiene la
                flexibilidad de sumar módulos especializados a medida que tu
                operación crezca.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2.5 lg:gap-4 mt-10 sm:flex-row w-full">
            <StartTrialButton
              slug="paquete-base-esencial"
              className="w-full bg-primary text-white py-3 rounded-xl hover:bg-red-700 transition cursor-pointer sm:w-59.25"
              pendingText="Preparando prueba..."
            >
              Iniciar prueba gratuita 🚀
            </StartTrialButton>
            <Link href="/modulos">
              <button className="w-full border border-primary text-primary py-3 rounded-xl hover:bg-gray-300 transition cursor-pointer sm:w-59.25">
                Conocer módulos
              </button>
            </Link>
          </div>
        </div>
      ),
    },

    {
      id: 3,
      content: (
        <div className="flex max-w-325 justify-center items-center mx-auto lg:h-[90vh] gap-2.5 pt-4 pb-18 lg:pb-0">
          <div className="relative h-120 w-126 shrink-0 hidden lg:block">
            <div className="absolute left-0 top-5 h-70 w-100 overflow-hidden rounded-3xl">
              <Image
                src="/images/hero-section-2.0.png"
                alt="Hero Section 2"
                width={800}
                height={600}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="absolute right-10 top-35 h-88 w-58 overflow-hidden rounded-3xl">
              <Image
                src="/images/hero-section-2.1.png"
                alt="Hero Section 2.1"
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="w-full lg:w-250 px-4 xl:px-0">
            <div className="w-full">
              <div className="flex flex-col gap-5.5 lg:gap-4">
                <h2 className="text-[30px] font-semibold leading-tight md:text-5xl lg:text-6xl text-base-black">
                  Excelencia industrial accesible para{" "}
                  <span className="text-secondary">pequeñas</span> y{" "}
                  <span className="text-secondary">grandes</span> empresas
                </h2>
                <p className="text-lg text-primary-text leading-6 md:text-[22px] md:leading-7">
                  Democratizamos la seguridad de alto nivel. Implementa MIPER,
                  Control Documental y Asistente Virtual de Prevención, y
                  protege a tus trabajadores sin el presupuesto de una gran
                  minera.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 lg:gap-4 mt-10 sm:flex-row">
                <StartTrialButton
                  slug="paquete-base-esencial"
                  className="w-full bg-secondary text-white py-3 rounded-xl hover:bg-teal-700 transition cursor-pointer sm:w-59.25"
                  pendingText="Preparando prueba..."
                >
                  Comenzar gratis ahora 🚀
                </StartTrialButton>
                <Link href="/modulos">
                  <button className="w-full border border-secondary text-secondary py-3 rounded-xl hover:bg-gray-300 transition cursor-pointer sm:w-59.25">
                    Conocer módulos
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return <HeroSlider slides={slides} intervalMs={8000} controls={false} />
  
};

export default HeroSection;