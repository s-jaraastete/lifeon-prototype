import React from 'react'
import HeroSlider from './HeroSlider';
import Image from 'next/image';

const HeroSection = () => {
    const slides = [
    { id: 1, content: 
    <div className="flex max-w-325 justify-center items-center mx-auto h-[80vh]">
      <div className=''>
        <div className="flex flex-col gap-4">
          <h1 className="text-6xl font-semibold leading-tight">Gestión de riesgos inteligente, accesible y 100% auditable.</h1>
          <p className='text-[22px] text-primary-text leading-7'>Estandariza la seguridad de tu empresa. Adopta los altos estándares de la industria en una plataforma intuitiva que evoluciona con tu negocio, activando soluciones a tu propio ritmo.</p>
        </div>
        <div className="flex gap-4 mt-10">
          <button className="w-59.25 bg-secondary text-white py-3 rounded-xl hover:bg-teal-700 transition cursor-pointer">
            Iniciar prueba gratuita 🚀
          </button>
          <button className="w-59.25 border border-secondary text-secondary py-3 rounded-xl hover:bg-gray-300 transition cursor-pointer">
            Conocer módulos
          </button>
        </div>
      </div>
      <div className='w-full'>
        <div>
          <Image src="/images/hero-section-1.png" alt="Hero Section 1" width={1000} height={1000} />
        </div>
      </div>
    </div> },

    { id: 2, content:
    <div className="flex items-center justify-center h-[60vh]">
      Pantalla 2
    </div> },

    { id: 3, content: 
    <div className="flex items-center justify-center h-[60vh]">
      Pantalla 3
    </div> },
  ]

  return <HeroSlider slides={slides} intervalMs={7000} controls={false} />
  
};

export default HeroSection;