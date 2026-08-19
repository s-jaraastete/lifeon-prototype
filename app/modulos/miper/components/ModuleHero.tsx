import Link from "next/link";
import Image from "next/image";
import { LuTable } from "react-icons/lu";

const ModuleHero = () => {
  return (
    <section className="w-full py-15 lg:py-25 px-4 xl:px-0 mb-35 bg-[linear-gradient(90deg,#E1C4F130_59.13%,#E2C4F278_100%)]">
      <div className="max-w-325 mx-auto flex flex-col items-center justify-center">
        <div className="max-w-240 flex flex-col gap-5.5">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="bg-purple-300 w-12 h-12 flex items-center justify-center rounded-2xl">
              <LuTable size={22} className="text-black" />
            </div>
            <p className="text-lg lg:text-2xl font-semibold text-base-black">Matriz IPER</p>
          </div>
          <h1 className="text-3xl lg:text-5xl font-semibold text-base-black text-center leading-tight">
            Gestiona tu Matriz IPER de forma centralizada y conforme al DS44
          </h1>
          <p className="lg:text-[22px] text-center text-base-black leading-tight">
            El módulo MIPER permite identificar peligros, evaluar riesgos, definir
            medidas de control y mantener un registro actualizado de toda la
            gestión preventiva. Diseñado para facilitar el cumplimiento normativo
            y entregar trazabilidad en cada etapa del proceso.
          </p>
        </div>
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
      <div className="h-181 max-w-325 mx-auto relative mt-20">
        <Image
          src="/images/miper-hero-image.png"
          alt="Matriz IPER"
          fill
          className="object-contain"
        />
      </div>
    </section>
  );
};

export default ModuleHero;