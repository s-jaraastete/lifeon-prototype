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
  const slidesRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)

  const scrollToSlide = (i: number) => {
    const el = slidesRef.current
    if (el) {
      isScrolling.current = true
      el.scrollLeft = i * el.clientWidth
      setTimeout(() => { isScrolling.current = false }, 800)
    }
  }

  const next = () => {
    const nextIdx = (index + 1) % slides.length
    scrollToSlide(nextIdx)
    setIndex(nextIdx)
    restartAutoplay()
  }

  const prev = () => {
    const prevIdx = (index - 1 + slides.length) % slides.length
    scrollToSlide(prevIdx)
    setIndex(prevIdx)
    restartAutoplay()
  }

  useEffect(() => {
    if (!autoplay || slides.length <= 1) return
    const start = () => {
      stop()
      timerRef.current = window.setInterval(() => {
        if (!pausedRef.current) {
          setIndex(prev => {
            const nextIdx = prev + 1
            if (nextIdx >= slides.length) {
              if (loop) {
                setTimeout(() => scrollToSlide(0), 0)
                return 0
              }
              return prev
            }
            setTimeout(() => scrollToSlide(nextIdx), 0)
            return nextIdx
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

  const goTo = (i: number) => {
    scrollToSlide(i)
    setIndex(i)
    restartAutoplay()
  }

  const restartAutoplay = () => {
    if (!autoplay || slides.length <= 1) return
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    timerRef.current = window.setInterval(() => {
      if (!pausedRef.current) {
        setIndex(prev => {
          const nextIdx = prev + 1
          if (nextIdx >= slides.length) {
            if (loop) {
              setTimeout(() => scrollToSlide(0), 0)
              return 0
            }
            return prev
          }
          setTimeout(() => scrollToSlide(nextIdx), 0)
          return nextIdx
        })
      }
    }, intervalMs)
  }

  const onScroll = () => {
    if (isScrolling.current || !slidesRef.current) return
    const slideWidth = slidesRef.current.clientWidth
    const newIdx = Math.round(slidesRef.current.scrollLeft / slideWidth)
    if (newIdx !== index) {
      setIndex(newIdx)
      restartAutoplay()
    }
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Carousel"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev()
        if (e.key === 'ArrowRight') next()
      }}
    >
      <div
        ref={slidesRef}
        className="w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar scroll-smooth flex items-center lg:grid lg:place-items-center lg:overflow-visible lg:snap-none"
        onScroll={onScroll}
      >
        {slides.map((s, i) => (
          <div
            key={i}
            className={`w-full shrink-0 snap-start lg:col-start-1 lg:row-start-1 lg:transition-opacity lg:duration-700 lg:ease-in-out ${
              i === index ? 'opacity-100' : 'lg:opacity-0 lg:pointer-events-none'
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
