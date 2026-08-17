'use client'

import Image from 'next/image';
import { LuFileSearch2, LuTable } from 'react-icons/lu';
import CardSlider from '@/app/components/shared/CardSlider';
import ModuleCard from './ModuleCard';

export const CardData = [
  {
    icon: <LuTable size={24} className="text-black" />,
    bgIcon: "bg-purple-300",
    title: "Matriz MIPER",
    description: "Identifica, evalúa y controla los riesgos mediante matrices digitales, trazables y alineadas al DS 44.",
    details: [
      "Gestiona peligros, riesgos y medidas de control.",
      "Estandariza los criterios de evaluación.",
      "Mantén tus matrices siempre actualizadas.",
      "Facilita los procesos de revisión y aprobación.",
      "Conserva un historial completo de cada cambio.",
    ],
    buttonLink: "/modulos/miper",
  },
  {
    icon: <LuFileSearch2 size={24} className="text-black" />,
    bgIcon: "bg-[#7dd3fc]",
    title: "Programa y Documentación Preventiva",
    description: "Planifica las actividades de seguridad y mantén tu documentación preventiva organizada, vigente y disponible.",
    details: [
      "Programa actividades, inspecciones y compromisos.",
      "Asigna responsables y fechas de cumplimiento.",
      "Centraliza documentos y registros preventivos.",
      "Controla estados, avances y vencimientos.",
      "Mantén disponible la evidencia de tu gestión.",
    ],
    buttonLink: "/contacto",
  },
  {
    icon: (
      <div className="flex items-center justify-center overflow-hidden h-6 w-6">
        <Image 
          src="/svg/apr-icon.svg" 
          width={24}
          height={24} 
          alt="APR Virtual"
        />
      </div>
    ),
    bgIcon: "bg-gradient-to-b from-[#BDE7FF] to-[#ADF2D3]",
    title: "APR Virtual",
    titleChip: "IA",
    description: "Entrega orientación preventiva inmediata mediante un asistente inteligente que agiliza las tareas diarias.",
    details: [
      "Resuelve consultas preventivas de manera rápida.",
      "Facilita el acceso a normativa y procedimientos.",
      "Apoya la elaboración de contenidos y documentos.",
      "Entrega orientación según las necesidades del usuario.",
      "Reduce los tiempos de búsqueda y respuesta.",
    ],
    buttonLink: "/contacto",
  },
];

const BaseModules = () => {
  return (
    <section className="w-full py-10 px-4 xl:px-0">
      <div className="max-w-325 mx-auto">
        <div className="flex flex-col items-center justify-center gap-2.5">
          <h2 className="text-3xl lg:text-[40px] font-semibold text-base-black text-center">
            Módulos base esenciales
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

export default BaseModules;
