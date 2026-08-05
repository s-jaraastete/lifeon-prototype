import Image from 'next/image';
import { LuCheck, LuFileSearch2, LuTable } from 'react-icons/lu';
import CardSlider from './CardSlider';
import PlanPricingCard, { PlanPricingCardProps } from './PlanPricingCard';

export const CardData: PlanPricingCardProps[] = [
  {
    title: "Free",
    subtitle: "Empieza a digitalizarte.",
    price: "$0",
    buttonText: "Comienza ahora",
    buttonVariant: "primary",
    features: [
      {
        icon: <LuTable size={10} className="text-black" />,
        bgIcon: "bg-purple-300",
        text: 'Matriz IPER ',
        boldText: 'Limited',
        suffix: ' (1 matriz)'
      },
      {
        icon: <LuFileSearch2 size={10} className="text-black" />,
        bgIcon: "bg-sky-300",
        text: 'Programa y Documentación preventiva ',
        boldText: 'Limited'
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Soporte estándar'
      },
    ],
  },
  {
    title: "Starter",
    subtitle: "Organiza tu operación diaria.",
    price: "1 UF",
    period: "mensual",
    buttonText: "Comienza ahora",
    buttonVariant: "primary",
    badge: "Más popular",
    isPopular: true,
    features: [
      {
        icon: <LuTable size={10} className="text-black" />,
        bgIcon: "bg-purple-300",
        text: 'Matriz IPER ',
        suffix: '(Hasta 3 matrices)'
      },
      {
        icon: <LuFileSearch2 size={10} className="text-black" />,
        bgIcon: "bg-sky-300",
        text: 'Programa y Documentación preventiva'
      },
      {
        icon: (
          <Image
            src="/svg/apr-icon.svg"
            width={10}
            height={10}
            alt="APR"
          />
        ),
        bgIcon: "bg-gradient-to-b from-[#BDE7FF] to-[#ADF2D3]",
        text: 'APR Virtual',
        hasAiBadge: true
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Reportes'
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Soporte estándar'
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Compatible con futuros módulos'
      },
    ],
    footerText: "Valores incluyen IVA",
  },
  {
    title: "Business",
    subtitle: "Automatiza y obtén indicadores.",
    price: "2,5 UF",
    period: "mensuales",
    buttonText: "Comienza ahora",
    buttonVariant: "primary",
    features: [
      {
        icon: <LuTable size={10} className="text-black" />,
        bgIcon: "bg-purple-300",
        text: 'Matriz IPER ',
        suffix: '(Hasta 6 matrices)'
      },
      {
        icon: <LuFileSearch2 size={10} className="text-black" />,
        bgIcon: "bg-sky-300",
        text: 'Programa y Documentación preventiva'
      },
      {
        icon: (
          <Image
            src="/svg/apr-icon.svg"
            width={10}
            height={10}
            alt="APR"
          />
        ),
        bgIcon: "bg-gradient-to-b from-[#BDE7FF] to-[#ADF2D3]",
        text: 'APR Virtual',
        hasAiBadge: true
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'APR virtual Assistant',
        hasAiBadge: true
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Reportes avanzados'
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Soporte prioritario'
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Compatible con futuros módulos'
      },
    ],
    footerText: "Valores incluyen IVA",
  },
  {
    title: "Customizado",
    subtitle: "Adapta LifeOn a tu organización",
    buttonText: "Habla con un asesor",
    buttonVariant: "secondary",
    features: [
      {
        icon: <LuTable size={10} className="text-black" />,
        bgIcon: "bg-purple-300",
        text: 'Matriz IPER'
      },
      {
        icon: <LuFileSearch2 size={10} className="text-black" />,
        bgIcon: "bg-sky-300",
        text: 'Programa y Documentación preventiva'
      },
      {
        icon: (
          <Image
            src="/svg/apr-icon.svg"
            width={10}
            height={10}
            alt="APR"
          />
        ),
        bgIcon: "bg-gradient-to-b from-[#BDE7FF] to-[#ADF2D3]",
        text: 'APR Virtual',
        hasAiBadge: true
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'APR virtual Assistant',
        hasAiBadge: true
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Reportes avanzados'
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Integraciones'
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Soporte prioritario'
      },
      {
        icon: <LuCheck size={18} className="text-secondary font-bold" />,
        text: 'Compatible con futuros módulos'
      },
    ],
  },
];

const PlansPricing = () => {
  return (
    <section className="w-full py-15 px-4 xl:px-0">
      <div className="max-w-325 mx-auto">
        <div className="flex flex-col items-center justify-center gap-2.5">
          <h3 className="lg:text-2xl font-semibold text-secondary">PAQUETE BASE ESENCIAL</h3>
          <h2 className="text-3xl lg:text-5xl font-semibold text-base-black text-center">La solución que tu empresa necesita hoy</h2>
          <p className="lg:text-lg text-center lg:mx-30">
            Comienza con el paquete de módulos fundamentales para fortalecer la gestión
            de seguridad y operation de tu organización. Una base sólida que evoluciona
            junto a tu empresa dentro de un único ecosistema integrado.
          </p>
        </div>
        
        <CardSlider
          cardData={CardData}
          CardComponent={PlanPricingCard}
        />

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
  );
};

export default PlansPricing;
