import React from 'react'
import Image from 'next/image'
import Carousel from '../ui/Carousel'

const Comments = () => {
  const slides = [
    <div key="comment-1" className="py-5.5 lg:pt-12 lg:pb-0">
      <blockquote className="max-w-3xl mx-auto text-center text-lg lg:text-xl text-primary-text">
        &ldquo;Antes gestionábamos riesgos en múltiples planillas y documentos.
        Con LifeOn logramos centralizar toda la información, mejorar la
        trazabilidad y reducir significativamente el tiempo dedicado al
        seguimiento.&rdquo;
      </blockquote>
      <div className="mt-5.5 lg:mt-6 flex flex-col items-center">
        <div className="h-20 w-20 rounded-full overflow-hidden relative">
          <Image
            src="/images/testing-image-comments-card.png"
            alt="GS"
            fill
            className="object-cover"
          />
        </div>
        <p className="lg:mt-2 font-semibold text-lg">Gabriela Suarez</p>
        <p className="lg:text-lg text-black">
          Gerente de seguridad - Minera Escondida
        </p>
      </div>
    </div>,
    <div key="comment-2" className="py-7.5 lg:pt-12 lg:pb-0">
      <blockquote className="max-w-3xl mx-auto text-center text-lg lg:text-xl text-primary-text">
        &ldquo;La plataforma nos permitió unificar procesos y mejorar la
        comunicación entre equipos. Su implementación fue rápida y con
        resultados medibles.&rdquo;
      </blockquote>
      <div className="mt-5.5 lg:mt-6 flex flex-col items-center">
        <div className="rounded-full overflow-hidden relative">
          <Image
            src="/images/testing-image-comments-card.png"
            alt="CM"
            width={80}
            height={80}
            className="object-cover border"
          />
        </div>
        <p className="lg:mt-2 font-semibold text-lg">Carlos M</p>
        <p className="lg:text-lg text-black">Jefe de Prevención - Empresa X</p>
      </div>
    </div>,
  ];

  return (
    <section className="w-full py-15">
      <div className="bg-gray-200 pt-15 pb-12 lg:py-25 px-4 xl:px-0">
        <div className="max-w-325 mx-auto flex flex-col gap-0">
          <h3 className="text-[30px] lg:text-5xl font-semibold text-black text-center lg:mx-20">
            Empresas que <span className="text-secondary">transforman</span> su
            gestión preventiva con LifeOn
          </h3>
          <div className="w-full">
            <div className="lg:hidden">
              <Carousel
                slides={slides}
                intervalMs={7000}
                indicators={true}
                autoplay
                controls={false}
                pauseOnHover
              />
            </div>
            <div className="hidden lg:block">
              <Carousel
                slides={slides}
                intervalMs={7000}
                indicators={false}
                autoplay
                controls
                pauseOnHover
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Comments;