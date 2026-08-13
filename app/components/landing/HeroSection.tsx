"use client";

import Image from 'next/image';
import Link from 'next/link';

import HeroSlider from './HeroSlider';
import ModuleCardsRow from './ModuleCardsRow';


const HeroSection = () => {
  const slides = [
    {
      id: 1,
      content: (
        <div className="flex items-center w-full h-full lg:min-h-[calc(100vh-70px)] overflow-hidden">
          <div className="relative z-10 h-full max-w-325 mx-auto flex items-center pt-4 pb-18 lg:pb-0 w-full">
            <div className="px-4 xl:px-0 lg:w-[50%] xl:w-[65%]">
              <div className="flex flex-col gap-5.5 lg:gap-4">
                <h1 className="text-[30px] font-semibold leading-tight md:text-5xl lg:text-6xl text-base-black">
                  Toda la gestión de seguridad de tu empresa, en una sola
                  plataforma.
                </h1>
                <p className="text-lg text-primary-text leading-6 md:text-[22px] md:leading-7">
                  Centraliza tus procesos, conecta a tus equipos y gestiona
                  información trazable, actualizada y lista para tomar mejores
                  decisiones.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 lg:gap-4 mt-10 sm:flex-row">
                <Link href="/precios">
                  <button className="w-full bg-secondary text-white py-3 rounded-xl hover:bg-teal-700 transition cursor-pointer sm:w-59.25">
                    Comienza ahora 🚀
                  </button>
                </Link>
                <Link href="/modulos">
                  <button className="w-full border border-secondary text-secondary py-3 rounded-xl hover:bg-gray-300 transition cursor-pointer sm:w-59.25">
                    Conoce los módulos
                  </button>
                </Link>
              </div>
            </div>
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
        <div className="flex flex-col w-full items-center justify-center lg:h-full px-4 xl:px-0 pt-4 pb-18 lg:pb-0">
          <div className="flex flex-col items-center justify-center gap-7.5 group">
            <ModuleCardsRow isActive={isActive} />
            <div className="flex flex-col gap-5.5 lg:gap-4 items-center w-full lg:w-240">
              <h2 className="text-[30px] font-semibold leading-tight lg:text-center md:text-5xl lg:text-6xl text-base-black">
                Comienza con lo esencial.{" "}
                <span className="text-secondary">Crece con LifeOn</span>
              </h2>
              <p className="text-lg text-primary-text leading-6 lg:text-center md:text-[22px] md:leading-7">
                Gestiona MIPER, Programa y Documentación Preventiva y un Asesor de
                Prevención de Riesgos Virtual desde una solución integrada, con la flexibilidad
                de sumar nuevos módulos cuando los necesites.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2.5 lg:gap-4 mt-10 sm:flex-row w-full">
            <Link href="/precios">
              <button className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary-hover transition cursor-pointer sm:w-59.25">
                Comienza ahora 🚀
              </button>
            </Link>
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
                  <span className="text-secondary">Seguridad de alto nivel </span>{" "}
                  para empresas de todos los tamaños.
                </h2>
                <p className="text-lg text-primary-text leading-6 md:text-[22px] md:leading-7">
                  Desde pequeñas empresas hasta grandes organizaciones, LifeOn se adapta a
                  tu operación, tus equipos y tus necesidades de crecimiento.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 lg:gap-4 mt-10 sm:flex-row">
                <Link href="/precios">
                  <button className="w-full bg-secondary text-white py-3 rounded-xl hover:bg-teal-700 transition cursor-pointer sm:w-59.25">
                    Comienza ahora 🚀
                  </button>
                </Link>
                <Link href="/modulos">
                  <button className="w-full border border-secondary text-secondary py-3 rounded-xl hover:bg-gray-300 transition cursor-pointer sm:w-59.25">
                    Conoce los módulos
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