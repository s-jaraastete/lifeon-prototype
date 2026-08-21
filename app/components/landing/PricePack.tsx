/* "use client";

import { useState } from 'react';
import Image from 'next/image';
import Switch from '../ui/Switch';
import StartTrialButton from '../shopping/StartTrialButton';

// Icons
import { LuFileSearch2, LuTable } from 'react-icons/lu';

//TODO: ELIMINAR ESTO
const PricePack = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  
  return (
  <section className="border-2 border-gray-300 rounded-3xl p-6 w-full">
    <div className="flex flex-col-reverse lg:flex-row items-start lg:items-center justify-between">
      <div className="flex items-center mt-5.5 lg:mt-0">
        <div className="group inline-flex items-center">
          <div className="flex items-center transition-all duration-300 group-hover:gap-2 gap-0">
            <div className="rounded-xl p-3 border-2 border-white bg-purple-300 transform transition-transform duration-300">
              <LuTable className="text-xs lg:text-xl text-black" />
            </div>
            <div className="hidden md:group-hover:flex items-center text-lg text-black">+</div>
              <div className="rounded-xl p-3 border-2 border-white bg-[#7dd3fc] transform -translate-x-1/2 group-hover:translate-x-0 transition-transform duration-300">
              <LuFileSearch2 className="text-xs lg:text-xl text-black" />
            </div>
            <div className="hidden md:group-hover:flex items-center text-lg text-black">+</div>
            <div className="rounded-xl p-3 border-2 border-white bg-linear-to-b from-azure-100 to-emerald-200 transform -translate-x-1/1 group-hover:translate-x-0 transition-transform duration-300">
              <Image 
                src="/svg/apr-icon.svg"
                className="h-3 w-3 lg:h-5 lg:w-5"
                width={20}
                height={20} 
                alt="APR Virtual"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between w-full lg:w-auto gap-2">
        <p className="text-primary-text">
          Anual (Ahorra un <span className="font-semibold text-secondary">15%</span> con un compromiso de un año)
        </p>
        <Switch 
          size="sm"
          onChange={(checked) => setIsAnnual(checked)} 
          bgColor="bg-teal-500"
        />
      </div>
    </div>
    <div className="flex flex-col mt-5">
      <h3 className="text-2xl font-semibold text-base-black">Primer mes de prueba gratis</h3>
      {isAnnual ? (
        <>
          <p className="text-lg text-black">
            Luego pagas <span className='font-semibold'>25,5 UF</span> por el año completo / Tienes 30 días para cancelar sin cobros
          </p>
          <p className="text-sm text-secondary-text">
            (Equivale a 2,12 UF/mes, ahorrando 4,5 UF)
          </p>
        </>
      ) : (
        <p className="text-lg text-black">
          Luego pagas <span className='font-semibold'>2,5 UF</span> mensual / Cancela cuando quieras
        </p>
      )}
    </div>
    <div className="mt-5">
      <StartTrialButton
        slug="paquete-base-esencial"
        className="w-full lg:w-59.25 bg-secondary text-white py-3 rounded-xl hover:bg-teal-700 transition cursor-pointer"
        pendingText="Preparando prueba..."
      >
        Comienza ahora
      </StartTrialButton>
    </div>
  </section>
  )
};

export default PricePack; */

//TODO: REMOVER