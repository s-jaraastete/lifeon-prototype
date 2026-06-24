import React from 'react'

// Icons
import { LuAward, LuCircleCheck, LuMonitorSmartphone } from 'react-icons/lu';


interface InfoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const InfoCard = ({ title, description, icon }: InfoCardProps) => {
  return (
    <div className='border border-gray-300 p-6 flex flex-col gap-5 rounded-3xl w-full'>
      <div className='bg-primary w-9 h-9 flex items-center justify-center rounded-xl'>
        {icon}
      </div>
      <div className='flex flex-col gap-2'>
        <h3 className='text-lg font-semibold'>{title}</h3>
        <p className='text-primary-text'>{description}</p>
      </div>
    </div>
  )
};

const AssociatedCompanies = () => {
  const cardData = [
    {
      title: "Cumplimiento normativo sin dolores de cabeza",
      description: "Simplifica el marco legal chileno en una interfaz intuitiva y 100% auditable ante cualquier inspección.",
      icon: <LuCircleCheck className="text-white w-5 h-5" />
    },
    {
      title: "Excelencia industrial al alcance de tu PYME",
      description: "Herramientas de control de la gran minería adaptadas para proteger el talento y capital de medianas y pequeñas empresas.",
      icon: <LuAward className="text-white w-5 h-5" />
    },
    {
      title: "Gestión participativa en tiempo real",
      description: "Automatiza la prevención activa involucrando a toda la organización desde cualquier dispositivo.",
      icon: <LuMonitorSmartphone className="text-white w-5 h-5" />
    },
  ]
  
  return (
    <section className="w-full pb-15">
      <div className="max-w-325 mx-auto h-[50vh] flex flex-col justify-center items-center gap-8">
        <h2 className="text-3xl font-semibold text-center mb-8 mx-30">
          +1.700 empresas usan LifeOn para simplificar el cumplimiento normativo y la gestión de riesgos.
        </h2>
        <div className="flex gap-20 justify-between">
          <p className='font-bold text-4xl text-gray-600 transition duration-300 hover:text-orange-500 hover:scale-110 origin-bottom inline-block'>
            ESCONDIDA | BHP
          </p>
          <p className='font-bold text-4xl text-gray-600 transition duration-300 hover:text-orange-500 hover:scale-110 origin-bottom inline-block'>
            SPENCE | BHP
          </p>
          <p className='font-bold text-4xl text-gray-600 transition duration-300 hover:text-orange-500 hover:scale-110 origin-bottom inline-block'>
            CERRO COLORADO | BHP
          </p>
        </div>
      </div>
      <div className="max-w-325 mx-auto">
        <h2 className="text-5xl font-semibold text-center mb-10 mx-30">
          Diseñado para <span className="text-secondary">proteger</span> tu capital, tu talento y tu operación
        </h2>
        <div className="flex flex-col lg:flex-row gap-6 justify-center">
          {cardData.map((card, index) => (
            <InfoCard
              key={index}
              title={card.title}
              description={card.description}
              icon={card.icon}
            />
          ))}
        </div>
      </div>
    </section>
  )
};

export default AssociatedCompanies;