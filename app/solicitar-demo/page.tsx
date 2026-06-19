import Image from "next/image";

export default function SolicitarDemoPage() {
  return (
    <div className="relative w-full min-h-screen">
      {/* Background Image */}
      <Image
        src="/images/request-demo.png"
        alt="Solicita tu demostración"
        fill
        className="object-cover"
        priority
      />
      
      {/* Gradient layer (Overlay) */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_59.13%,transparent_100%)]" />
      
      {/* Content (relative z-10 to be above gradient layer) */}
      <div className="relative z-10 px-6 py-25">
        <div className="flex flex-col mx-auto max-w-[1300px] lg:flex-row gap-15">
          <div className="flex-1 flex flex-col lg:my-[75px] text-white">
            <h1 className="text-[60px] leading-18 font-bold mb-5.5">
              Solicita una demostración y obtén 1 mes gratis de prueba
            </h1>
            <p className="text-[22px] leading-7.5">
              Conoce la plataforma en acción y descubre cómo cientos de organizaciones están modernizando su gestión preventiva. Solicita una demostración personalizada y comienza con 1 mes de prueba sin costo.
            </p>
          </div>
          <div className="flex-1 max-w-[569px]">
          </div>
        </div>
      </div>
    </div>
  );
}
