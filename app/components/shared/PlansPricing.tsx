'use client'

import Image from 'next/image';
import { LuCheck, LuFileSearch2, LuTable } from 'react-icons/lu';

import Switch from '../ui/Switch';
import CardSlider from './CardSlider';
import PlanPricingCard, { PlanPricingCardProps } from './PlanPricingCard';


interface PlansPricingProps {
  plans: Pack[];
}

const IPERModule = {
  icon: <LuTable size={10} className="text-black" />,
  bgIcon: "bg-purple-300",
  text: 'Matriz IPER ',
};

const DocumentationModule = {
  icon: <LuFileSearch2 size={10} className="text-black" />,
  bgIcon: "bg-sky-300",
  text: 'Programa y Documentación preventiva ',
};

const APRVirtualModule = {
  icon: <Image src="/svg/apr-icon.svg" width={10} height={10} alt="APR" />,
  bgIcon: "bg-gradient-to-b from-[#BDE7FF] to-[#ADF2D3]",
  text: 'APR Virtual',
  hasAiBadge: true,
};

const APRAssistantModule = {
  icon: <LuCheck size={18} className="text-secondary font-bold" />,
  text: 'APR virtual Assistant',
  hasAiBadge: true,
};

const CheckFeature = {
  icon: <LuCheck size={18} className="text-secondary font-bold" />,
};

/* export const CardData: PlanPricingCardProps[] = [
  {
    title: "Free",
    subtitle: "Empieza a digitalizarte.",
    price: "$0",
    buttonText: "Comienza ahora",
    buttonVariant: "primary",
    features: [
      { ...IPERModule, boldText: 'Limited', suffix: ' (1 matriz)' },
      { ...DocumentationModule, boldText: 'Limited' },
      { ...CheckFeature, text: 'Soporte estándar' },
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
      { ...IPERModule, suffix: '(Hasta 3 matrices)' },
      DocumentationModule,
      APRVirtualModule,
      { ...CheckFeature, text: 'Reportes' },
      { ...CheckFeature, text: 'Soporte estándar' },
      { ...CheckFeature, text: 'Compatible con futuros módulos' },
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
      { ...IPERModule, suffix: '(Hasta 6 matrices)' },
      DocumentationModule,
      APRVirtualModule,
      APRAssistantModule,
      { ...CheckFeature, text: 'Reportes avanzados' },
      { ...CheckFeature, text: 'Soporte prioritario' },
      { ...CheckFeature, text: 'Compatible con futuros módulos' },
    ],
    footerText: "Valores incluyen IVA",
  },
  {
    title: "Customizado",
    subtitle: "Adapta LifeOn a tu organización",
    buttonText: "Habla con un asesor",
    buttonVariant: "secondary",
    features: [
      IPERModule,
      DocumentationModule,
      APRVirtualModule,
      APRAssistantModule,
      { ...CheckFeature, text: 'Reportes avanzados' },
      { ...CheckFeature, text: 'Integraciones' },
      { ...CheckFeature, text: 'Soporte prioritario' },
      { ...CheckFeature, text: 'Compatible con futuros módulos' },
    ],
  },
]; */


const buildCardData = (plans: Pack[]): PlanPricingCardProps[] => {
  return plans.map((plan) => {
    const monthlyPrice = plan.prices.find(
      (price) => price.billing_period === 'monthly'
    );

    const features = plan.entitlements.map((item) => {
      const baseFeature = {
        text: item.display_name ?? item.entitlement.name,
        suffix: item.display_value
          ? ` (${item.display_value})`
          : undefined,
      };

      switch (item.entitlement.key) {
        case 'miper_matrix_limit':
          return {
            ...IPERModule,
            ...baseFeature,
          };

        case 'documentation_access_level':
          return {
            ...DocumentationModule,
            ...baseFeature,
          };

        case 'apr_virtual':
          return {
            ...APRVirtualModule,
            ...baseFeature,
          };

        case 'apr_virtual_assistant':
          return {
            ...APRAssistantModule,
            ...baseFeature,
          };

        default:
          return {
            ...CheckFeature,
            ...baseFeature,
          };
      }
    });

    return {
      title: plan.name,
      subtitle: plan.short_description ?? '',
      price:
        plan.plan_type === 'free'
          ? '$0'
          : monthlyPrice
            ? `${monthlyPrice.amount === "1.0" ? "1" : monthlyPrice.amount} ${monthlyPrice.currency}`
            : undefined,
      period:
        plan.plan_type === 'paid'
          ? monthlyPrice?.amount === '1.0'
            ? 'mensual'
            : 'mensuales'
          : undefined,
      buttonText:
        plan.cta_type === 'contact'
          ? 'Habla con un asesor'
          : 'Comienza ahora',
      buttonVariant:
        plan.cta_type === 'contact'
          ? 'secondary'
          : 'primary',
      badge: plan.badge ?? undefined,
      isPopular: plan.is_featured,
      features,
      footerText:
        plan.plan_type === 'paid'
          ? 'Valores incluyen IVA'
          : undefined,
    };
  });
};

const PlansPricing = ({ plans, compact = false }: PlansPricingProps & { compact?: boolean }) => {
  const cardData = buildCardData(plans);
  
  return (
    <section className="w-full py-15 px-4 xl:px-0">
      <div className="max-w-325 mx-auto">
        {!compact && (
          <div className="flex flex-col items-center justify-center gap-2.5">
            <h3 className="lg:text-2xl font-semibold text-secondary">Planes</h3>
            <h2 className="text-3xl lg:text-5xl font-semibold text-base-black text-center">
              Un plan para cada etapa de tu organización
            </h2>
            <p className="lg:text-lg text-center lg:mx-30">
              Elige un plan y accede a los módulos esenciales para digitalizar tu
              gestión preventiva. Tu plataforma estará preparada para incorporar
              nuevos módulos cuando los necesites.
            </p>
          </div>
        )}

        <div className="flex justify-end text-sm mt-12">
          <p>
            Anual (Ahorra un
            <span className="text-secondary px-1">15%</span>
            con un compromiso de un año)
          </p>
          <Switch 
            className="ml-2.5"
            size="sm"
            bgColor="bg-teal-500"
          />
        </div>

        <CardSlider cardData={cardData} CardComponent={PlanPricingCard} />

        <div className="mt-5.5">
          <p className="text-[10px] lg:text-xs text-secondary-text font-light text-justify">
            *Todos los precios están expresados en Unidad de Fomento Chilena
            (UF) e incluyen el Impuesto al Valor Agregado (IVA). Para grandes
            organizaciones que requieran integraciones avanzadas, el plan es
            completamente customizable tanto en funciones como en precio,
            adaptando la plataforma a la medida de su operación mediante una
            cotización directa con nuestro equipo. Las suscripciones se renuevan
            automáticamente según la modalidad elegida, otorgando total
            flexibilidad para añadir o modificar herramientas desde el panel de
            administración, mientras que las tarifas anuales conllevan un
            compromiso de permanencia de 12 meses a cambio del descuento
            preferencial aplicado.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PlansPricing;
