'use client'

import React, { useEffect, useRef, useState } from 'react'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'

type Props = {
  slides: React.ReactNode[]
  intervalMs?: number
  autoplay?: boolean
  pauseOnHover?: boolean
  controls?: boolean
  indicators?: boolean
  loop?: boolean
  initialIndex?: number
  className?: string
}

export default function Carousel({
  slides,
  intervalMs = 5000,
  autoplay = true,
  pauseOnHover = true,
  controls = true,
  indicators = true,
  loop = true,
  initialIndex = 0,
  className = '',
}: Props) {
  const [index, setIndex] = useState(initialIndex)
  const pausedRef = useRef(false)
  const timerRef = useRef<number | null>(null)
  const touchStartX = useRef(0)

  const next = () => setIndex((i) => (i + 1) % slides.length)
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length)

  useEffect(() => {
    if (!autoplay || slides.length <= 1) return
    const start = () => {
      stop()
      timerRef.current = window.setInterval(() => {
        if (!pausedRef.current) {
          setIndex((i) => {
            const nextIndex = i + 1
            if (nextIndex >= slides.length) return loop ? 0 : i
            return nextIndex
          })
        }
      }, intervalMs)
    }
    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    start()
    return stop
  }, [autoplay, intervalMs, slides.length, loop])

  const onMouseEnter = () => {
    if (pauseOnHover) pausedRef.current = true
  }
  const onMouseLeave = () => {
    if (pauseOnHover) pausedRef.current = false
  }

  const goTo = (i: number) => setIndex(i)

  const restartAutoplay = () => {
    if (!autoplay || slides.length <= 1) return
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    timerRef.current = window.setInterval(() => {
      if (!pausedRef.current) {
        setIndex((i) => {
          const nextIndex = i + 1
          if (nextIndex >= slides.length) return loop ? 0 : i
          return nextIndex
        })
      }
    }, intervalMs)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 30) {
      if (diff > 0) next()
      else prev()
      restartAutoplay()
    }
  }

  return (
    <div
      className={`relative w-full touch-pan-y h-full ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Carousel"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev()
        if (e.key === 'ArrowRight') next()
      }}
    >
      <div className="relative w-full grid place-items-center">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`col-start-1 row-start-1 transition-opacity duration-700 ease-in-out ${
              i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden={i === index ? 'false' : 'true'}
          >
            {s}
          </div>
        ))}
      </div>

      {controls && (
        <>
          <button
            aria-label="Anterior"
            onClick={prev}
            className="absolute left-4 top-30 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-200 z-20 transition duration-200 cursor-pointer"
          >
            <LuChevronLeft size={24} className="text-black" />
          </button>
          <button
            aria-label="Siguiente"
            onClick={next}
            className="absolute right-4 top-30 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-200 z-20 transition duration-200 cursor-pointer"
          >
            <LuChevronRight size={24} className="text-black" />
          </button>
        </>
      )}

      {indicators && (
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 flex justify-center gap-3 items-center mt-4 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`rounded-full transition-colors cursor-pointer ${
                i === index
                  ? 'h-2 w-11 bg-secondary'
                  : 'h-2.5 w-2.5 bg-teal-100 hover:bg-teal-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
