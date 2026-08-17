import { type ReactNode } from 'react';
import { type IconType } from 'react-icons';

export interface CardData {
  title: string;
  description: string;
  icon: IconType;
}

interface InfoCardsSectionProps {
  title: ReactNode;
  description?: string;
  cardsData: CardData[];
}

const InfoCard = ({ title, description, icon }: CardData) => {
  const Icon = icon;

  return (
    <div className='border border-gray-300 p-6 flex flex-col gap-5 rounded-3xl w-full h-full min-h-58'>
      <div className='bg-primary w-9 h-9 flex items-center justify-center rounded-xl'>
        <Icon className="text-white w-5 h-5" />
      </div>
      <div className='flex flex-col gap-2'>
        <h3 className='text-lg font-semibold text-base-black w-[90%]'>{title}</h3>
        <p className='text-primary-text'>{description}</p>
      </div>
    </div>
  )
};

const InfoCardsSection = ({ title, description, cardsData }: InfoCardsSectionProps) => {
  return (
    <section className="w-full my-15 px-4 xl:px-0">
      <div className="max-w-325 mx-auto">
        <h2 className="text-[30px] lg:text-5xl font-semibold text-center mb-10 lg:mx-30 text-base-black">
          {title}
        </h2>
        {description && (
          <p className="text-center text-lg text-primary-text mb-7.5 max-w-280 mx-auto">
            {description}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardsData.map((card, index) => (
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
  );
};

export default InfoCardsSection;
