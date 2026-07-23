import Image from 'next/image';
import React from 'react'

//Icons
import { LuCheck } from 'react-icons/lu';


const InfoPack = () => {
  
  const ListData = [
    "Comienza con nuestro Paquete Base Esencial",
    "Suma nuevas herramientas a tu ritmo y sin fricciones.",
    "Sin contratos de amarre ocultos ni costos sorpresa. Activa, desactiva o cambia tus módulos cuando lo necesites.",
    "Elige el pago anual para asegurar tarifas preferenciales.",
  ];
  
  return (
    <section className="w-full py-15 px-4 xl:px-0">
      <div className="max-w-325 mx-auto flex gap-20">
        <div className="hidden lg:block w-full h-144.5">
          <Image
            src="/images/info-pack.png"
            alt="Description"
            width={1000}
            height={400}
            className="object-cover w-full h-full rounded-3xl"
          />
        </div>
        <div className="w-full xl:h-144.5">
          <h4 className="text-[30px] lg:text-5xl font-semibold text-black leading-tight">
            Con <span className="text-primary">Life</span>
            <span className="text-secondary">On</span> no pagarás por
            herramientas que no usarás
          </h4>
          <p className="lg:text-lg text-primary-text mt-2.5">
            Comienza con los módulos esenciales para tu operación y expande tu
            plataforma cuando tu organización lo necesite. A medida que nuevos
            módulos estén disponibles, podrás incorporarlos fácilmente dentro de
            un único ecosistema integrado, sin costos innecesarios ni procesos
            complejos de implementación.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {ListData.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 lg:text-lg text-primary-text"
              >
                <LuCheck className="w-5 h-5 mt-1 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Image
            src="/images/placeholder-mobile.png"
            alt="Placeholder"
            width={330}
            height={488}
            className="mt-10 w-full sm:w-auto mx-auto lg:hidden"
          />
        </div>
      </div>
    </section>
  );
};

export default InfoPack;