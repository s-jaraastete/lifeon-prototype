/* import Image from 'next/image';
import { LuFileSearch2, LuTable } from 'react-icons/lu';
import CardSlider from '../shared/CardSlider';
import CardPack from './CardPack';
import PricePack from './PricePack';
//TODO
export const CardData = [
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
    bgIcon: "bg-[#7dd3fc]",
    title: "Programa y Documentación Preventiva",
    description: "Planifica las actividades de seguridad y mantén tu documentación preventiva organizada, vigente y disponible.",
    details: ["Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet"],
    borderButtonColor: "border-[#7dd3fc]",
    hoverButton: "hover:bg-[#7dd3fc]",
    hoverBorderCard: "hover:border-[#7dd3fc]",
    titleStart: true
  },
  {
    chip: "Incluído en Paquete Base Esencial",
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
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    details: ["Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet"],
    borderButtonColor: "border-[rgb(0,199,189)]",
    hoverButton: "hover:border-transparent hover:bg-[linear-gradient(white,white)_padding-box,linear-gradient(180deg,#BDE7FF_0%,#ADF2D3_100%)_border-box]",
    hoverBorderCard: "custom-hover-border-gradient"
  },
];

const BasePack = () => {
  return (
    <section className="w-full py-15 px-4 xl:px-0">
      <div className="max-w-325 mx-auto">
        <div className="flex flex-col items-center justify-center gap-2.5">
          <h3 className="lg:text-2xl font-semibold text-secondary">PAQUETE BASE ESENCIAL</h3>
          <h2 className="text-3xl lg:text-5xl font-semibold text-base-black text-center">La solución que tu empresa necesita hoy</h2>
          <p className='lg:text-lg text-center lg:mx-30'>
            Comienza con el paquete de módulos fundamentales para fortalecer la gestión
            de seguridad y operación de tu organización. Una base sólida que evoluciona
            junto a tu empresa dentro de un único ecosistema integrado.
          </p>
        </div>
        
        <CardSlider cardData={CardData} CardComponent={CardPack} showPlusSeparator />

        <div className="mt-6">
          <PricePack />
        </div>
        <div className="mt-5.5">
          <p className="text-[10px] lg:text-xs text-secondary-text font-light text-justify">
            *Se requiere ingresar un método de pago válido para activar tus 30 días de acceso gratuito,
            realizándose un cobro inicial de $0 CLP hoy. Puedes cancelar la renovación de tu cuenta o
            cambiar de plan en cualquier momento desde tu panel de configuración antes del día 30 para
            evitar cualquier cargo automático. Si decides continuar, la facturación (mensual o anual según tu selección)
            comenzará a regir a partir del día 31, calculándose el valor de la UF según la tasa oficial del día de cobro.
          </p>
        </div>
      </div>
    </section>
  )
};

export default BasePack; */

//TODO: REMOVER