import React from 'react'
import Image from 'next/image'
import Carousel from '../ui/Carousel'

const Comments = () => {
  const slides = [
    <div className="py-12">
      <blockquote className="max-w-3xl mx-auto text-center text-xl text-primary-text">
        "Antes gestionábamos riesgos en múltiples planillas y documentos. Con LifeOn logramos centralizar toda la información, mejorar la trazabilidad y reducir significativamente el tiempo dedicado al seguimiento."
      </blockquote>
      <div className="mt-6 flex flex-col items-center">
        <div className="h-20 w-20 rounded-full overflow-hidden relative">
          <Image src="/images/testing-image-comments-card.png" alt="GS" fill className="object-cover" />
        </div>
        <p className="mt-2 font-semibold text-lg">Gabriela Suarez</p>
        <p className="text-lg text-black">Gerente de seguridad - Minera Escondida</p>
      </div>
    </div>,
    <div className="py-12">
      <blockquote className="max-w-3xl mx-auto text-center text-xl text-primary-text">
        "La plataforma nos permitió unificar procesos y mejorar la comunicación entre equipos. Su implementación fue rápida y con resultados medibles."
      </blockquote>
      <div className="mt-6 flex flex-col items-center">
        <div className="rounded-full overflow-hidden relative">
          <Image src="/images/testing-image-comments-card.png" alt="CM" width={80} height={80} className="object-cover border" />
        </div>
        <p className="font-semibold text-lg">Carlos M</p>
        <p className="text-lg text-black">Jefe de Prevención - Empresa X</p>
      </div>
    </div> 
  ]

  return (
    <section className="w-full py-15">
      <div className="bg-gray-200 pt-25 pb-38">
        <div className="max-w-325 mx-auto flex flex-col gap-2">
          <h3 className="text-5xl font-semibold text-black text-center mx-20">
            Empresas que <span className="text-secondary">transforman</span> su gestión preventiva con LifeOn
          </h3>
          <div className='w-full'>
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
    </section>
  )
}

export default Comments;