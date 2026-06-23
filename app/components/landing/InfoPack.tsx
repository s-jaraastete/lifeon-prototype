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
    <div className="w-full py-15">
      <div className="max-w-325 mx-auto flex gap-20">
        <div className='w-full h-144.5'>
          <Image 
            src="/images/info-pack.png" 
            alt="Description" 
            width={1000} 
            height={400} 
            className="object-cover w-full h-full rounded-xl" 
          />
        </div>
        <div className='w-full h-144.5'>
          <h3 className="text-5xl font-semibold text-black leading-tight">
            Con <span className="text-primary">Life</span><span className="text-secondary">On</span> no pagarás por herramientas que no usarás
          </h3>
          <p className="text-lg text-primary-text mt-2.5">
            Comienza con los módulos esenciales para tu operación y expande tu plataforma cuando tu organización lo necesite. A medida que nuevos módulos estén disponibles, podrás incorporarlos fácilmente dentro de un único ecosistema integrado, sin costos innecesarios ni procesos complejos de implementación.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {ListData.map((item, index) => (
              <li key={index} className="text-lg text-primary-text">
                <LuCheck size={20} className="inline-block mr-2 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
};

export default InfoPack;