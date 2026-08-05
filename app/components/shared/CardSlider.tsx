'use client'

import React, { useState, useRef } from 'react'

type CardSliderProps<T extends object> = {
  cardData: T[]
  CardComponent: React.ComponentType<T>
  showPlusSeparator?: boolean
}

function CardSlider<T extends object>({
  cardData,
  CardComponent,
  showPlusSeparator = false,
}: CardSliderProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollToCard = (index: number) => {
    setActiveIndex(index)
    cardRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft
      const containerWidth = scrollContainerRef.current.offsetWidth
      const index = Math.round(scrollLeft / (containerWidth * 0.85))
      setActiveIndex(Math.min(index, cardData.length - 1))
    }
  }

  return (
    <>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex lg:flex-row lg:justify-between lg:items-stretch mt-10 overflow-x-auto snap-x snap-mandatory gap-4 lg:gap-5.5 px-4 lg:px-0 -mx-4 lg:mx-0 pt-4 pb-4 lg:pt-0 lg:pb-0 hide-scrollbar lg:overflow-visible lg:snap-none"
      >
        {cardData.map((card, index) => (
          <React.Fragment key={index}>
            <div
              ref={(el) => {
                cardRefs.current[index] = el
              }}
              onClick={() => scrollToCard(index)}
              className="snap-center min-w-[85%] sm:min-w-[45%] lg:min-w-0 lg:flex-1 flex"
            >
              <CardComponent {...card} />
            </div>
            {showPlusSeparator && index < cardData.length - 1 && (
              <div className="flex items-center justify-center text-[32px] lg:text-5xl text-teal-300 shrink-0">
                +
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-3 mt-4 lg:hidden">
        {cardData.map((_, index) => {
          const isActive = activeIndex === index
          return (
            <button
              key={index}
              type="button"
              onClick={() => scrollToCard(index)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                isActive ? 'bg-secondary' : 'bg-teal-100'
              }`}
            />
          )
        })}
      </div>
    </>
  )
}

export default CardSlider
