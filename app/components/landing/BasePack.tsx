import React from 'react'
import CardPack from './CardPack';
import PricePack from './PricePack';
// Icons
import { LuBotMessageSquare, LuFileSearch2, LuTable } from 'react-icons/lu';


const BasePack = () => {

  const CardData = [
    {
      chip: "Incluído en Paquete Base Esencial",
      icon: <LuTable size={24} className="text-black" />,
      bgIcon: "bg-purple-300",
      title: "MIPER",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
      details: ["Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet"],
      borderButtonColor: "border-purple-300",
      hoverButton: "hover:bg-purple-300",
      hoverBorderCard: "hover:border-purple-300"
    },
    {
      chip: "Incluído en Paquete Base Esencial",
      icon: <LuFileSearch2 size={24} className="text-black" />,
      bgIcon: "bg-sky-300",
      title: "Control documental",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
      details: ["Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet"],
      borderButtonColor: "border-sky-300",
      hoverButton: "hover:bg-sky-300",
      hoverBorderCard: "hover:border-sky-300"
    },
    {
      chip: "Incluído en Paquete Base Esencial",
      icon: <LuBotMessageSquare size={24} className="text-black" />,
      bgIcon: "bg-[rgb(0,199,189)]",
      title: "APR Virtual",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
      details: ["Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet"],
      borderButtonColor: "border-[rgb(0,199,189)]",
      hoverButton: "hover:bg-[rgb(0,199,189)]",
      hoverBorderCard: "hover:border-[rgb(0,199,189)]"
    },
  ];

  return (
    <section className="w-full py-15">
      <div className="max-w-325 mx-auto">
        <div className="flex flex-col items-center justify-center gap-4">
          <h3 className="text-2xl font-semibold text-secondary">PAQUETE BASE ESENCIAL</h3>
          <h2 className="text-5xl font-semibold text-black">La solución que tu empresa necesita hoy</h2>
          <p className='text-lg text-center mx-30'>Comienza con el paquete de módulos fundamentales para fortalecer la gestión de seguridad y operación de tu organización. Una base sólida que evoluciona junto a tu empresa dentro de un único ecosistema integrado.</p>
        </div>
        <div className="flex flex-col lg:flex-row justify-between items-center gap-2 mt-10">
          {CardData.map((card, index) => (
            <React.Fragment key={index}>
              <CardPack 
                chip={card.chip}
                icon={card.icon}
                bgIcon={card.bgIcon}
                title={card.title}
                description={card.description}
                details={card.details}
                borderButtonColor={card.borderButtonColor}
                hoverButton={card.hoverButton}
                hoverBorderCard={card.hoverBorderCard}
              />
              {index < CardData.length - 1 && (
                <div className="hidden lg:flex items-center justify-center text-5xl text-teal-300">+</div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-6">
          <PricePack />
        </div>
        <div className="mt-4">
          <p className="text-xs text-secondary-text font-light text-justify">
            *Se requiere ingresar un método de pago válido para activar tus 30 días de acceso gratuito, realizándose un cobro inicial de $0 CLP hoy. Puedes cancelar la renovación de tu cuenta o cambiar de plan en cualquier momento desde tu panel de configuración antes del día 30 para evitar cualquier cargo automático. Si decides continuar, la facturación (mensual o anual según tu selección) comenzará a regir a partir del día 31, calculándose el valor de la UF según la tasa oficial del día de cobro.
          </p>
        </div>
      </div>
    </section>
  )
};

export default BasePack;