'use client'

import { LuCircleCheck, LuRefreshCcw, LuSearch } from 'react-icons/lu';
import CardSlider from '@/app/components/shared/CardSlider';
import { ModuleBox } from '@/app/components/shared/baseModules';
import ModuleCard from './ModuleCard';

export const CardData = [
  {
    icon: (
      <ModuleBox bg="bg-gray-300" box="w-12 h-12">
        <LuRefreshCcw size={24} className="text-secondary-text" />
      </ModuleBox>
    ),
    title: "Gestión del cambio",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    chip: "Próximamente disponible",
  },
  {
    icon: (
      <ModuleBox bg="bg-gray-300" box="w-12 h-12">
        <LuCircleCheck size={24} className="text-secondary-text" />
      </ModuleBox>
    ),
    title: "Módulo 4",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    chip: "Próximamente disponible",
  },
  {
    icon: (
      <ModuleBox bg="bg-gray-300" box="w-12 h-12">
        <LuSearch size={24} className="text-secondary-text" />
      </ModuleBox>
    ),
    title: "Módulo 5",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    chip: "Próximamente disponible",
  },
];

const SpecializedModules = () => {
  return (
    <section className="w-full py-10 px-4 xl:px-0">
      <div className="max-w-325 mx-auto">
        <div className="flex flex-col items-center justify-center gap-2.5">
          <h2 className="text-3xl lg:text-[40px] font-semibold text-base-black text-center">
            Módulos especializados
          </h2>
        </div>
        
        <CardSlider
          cardData={CardData}
          CardComponent={ModuleCard}
        />
      </div>
    </section>
  )
};

export default SpecializedModules;
