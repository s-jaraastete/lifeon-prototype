"use client";

import { useState } from 'react';
import Switch from '../ui/Switch';

// Icons
import { LuBotMessageSquare, LuFileSearch2, LuTable } from 'react-icons/lu';


const PricePack = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  
  return (
  <div className="border-2 border-gray-300 rounded-xl p-6 w-full">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="group inline-flex items-center">
          <div className="flex items-center transition-all duration-300 group-hover:gap-2 gap-0">
            <div className="rounded-xl p-3 border-2 border-white bg-purple-300 shadow-md transform transition-transform duration-300">
              <LuTable className="text-xl text-black" />
            </div>
            <div className="hidden md:group-hover:flex items-center text-lg text-black">+</div>
            <div className="rounded-xl p-3 border-2 border-white bg-sky-300 shadow-md transform -translate-x-1/2 group-hover:translate-x-0 transition-transform duration-300">
              <LuFileSearch2 className="text-xl text-black" />
            </div>
            <div className="hidden md:group-hover:flex items-center text-lg text-black">+</div>
            <div className="rounded-xl p-3 border-2 border-white bg-[rgb(0,199,189)] shadow-md transform -translate-x-1/1 group-hover:translate-x-0 transition-transform duration-300">
              <LuBotMessageSquare className="text-xl text-black" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
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
      <h3 className="text-2xl font-semibold text-black">Primer mes de prueba gratis</h3>
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
      <button 
        className="w-59.25 bg-secondary text-white py-3 rounded-xl hover:bg-teal-700 transition cursor-pointer"
      >
        Comienza ahora
      </button>
    </div>
  </div>
  )
};

export default PricePack;