'use client'

import React, { useState, useRef } from 'react'
import CardPack from './CardPack';
import { CardData } from './BasePack';

type BasePackSliderProps = {
  cardData: typeof CardData;
}

const BasePackSlider = ({ cardData }: BasePackSliderProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToCard = (index: number) => {
    setActiveIndex(index);
    cardRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const index = Math.round(scrollLeft / (containerWidth * 0.85));
      setActiveIndex(Math.min(index, cardData.length - 1));
    }
  };

  return (
    <>
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex lg:flex-row lg:justify-between lg:items-center mt-10 overflow-x-auto snap-x snap-mandatory gap-1.25 lg:gap-2 px-4 lg:px-0 -mx-4 lg:mx-0 pb-0 hide-scrollbar lg:overflow-visible lg:snap-none"
      >
        {cardData.map((card, index) => (
          <React.Fragment key={index}>
            <div 
              ref={(el) => { cardRefs.current[index] = el; }}
              onClick={() => scrollToCard(index)}
              className="snap-center min-w-[85%] lg:min-w-0 lg:flex-1 cursor-pointer"
            >
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
                titleStart={card.titleStart}
                titleChip={card.titleChip}
              />
            </div>
            {index < cardData.length - 1 && (
              <div className="flex items-center justify-center text-[32px] lg:text-5xl text-teal-300 shrink-0">+</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-3 mt-4 lg:hidden">
        {cardData.map((_, index) => {
          const isActive = activeIndex === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => scrollToCard(index)}
              className={`h-2 w-2.5 rounded-full transition-all ${isActive ? 'bg-secondary' : 'bg-teal-100'}`}
            />
          )
        })}
      </div>
    </>
  )
};

export default BasePackSlider;
