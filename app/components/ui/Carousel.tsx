'use client'

import React, { useLayoutEffect, useEffect, useRef, useState } from 'react'
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

  const hasClones = loop && slides.length > 1
  const displaySlides = hasClones ? [slides[slides.length - 1], ...slides, slides[0]] : slides
  const offset = hasClones ? 1 : 0

  const jumpTo = (targetScrollLeft: number) => {
    const el = slidesRef.current
    if (!el) return
    isScrolling.current = true
    el.style.scrollBehavior = 'auto'
    el.scrollLeft = targetScrollLeft
    el.style.scrollBehavior = ''
    setTimeout(() => { isScrolling.current = false }, 50)
  }

  const scrollToSlide = (i: number) => {
    const el = slidesRef.current
    if (el) {
      isScrolling.current = true
      el.scrollLeft = (i + offset) * el.clientWidth
      setTimeout(() => { isScrolling.current = false }, 800)
    }
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

  useLayoutEffect(() => {
    const el = slidesRef.current
    if (!el) return
    if (hasClones) {
      el.scrollLeft = (initialIndex + 1) * el.clientWidth
    }
    const handleScrollEnd = () => {
      if (isScrolling.current || !hasClones) return
      const slideWidth = el.clientWidth
      const rawIdx = Math.round(el.scrollLeft / slideWidth)
      if (rawIdx === 0) {
        jumpTo(slides.length * slideWidth)
        setIndex(slides.length - 1)
        restartAutoplay()
        return
      }
      if (rawIdx === slides.length + 1) {
        jumpTo(slideWidth)
        setIndex(0)
        restartAutoplay()
      }
    }
    el.addEventListener('scrollend', handleScrollEnd)
    return () => el.removeEventListener('scrollend', handleScrollEnd)
  }, [hasClones, initialIndex])

  const nextFn = () => {
    const nextIdx = (index + 1) % slides.length
    scrollToSlide(nextIdx)
    setIndex(nextIdx)
    restartAutoplay()
  }

  const prevFn = () => {
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

  const onScroll = () => {
    if (isScrolling.current || !slidesRef.current) return
    const rawIdx = Math.round(slidesRef.current.scrollLeft / slidesRef.current.clientWidth)
    const newIdx = rawIdx - offset
    if (newIdx >= 0 && newIdx < slides.length && newIdx !== index) {
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
        if (e.key === 'ArrowLeft') prevFn()
        if (e.key === 'ArrowRight') nextFn()
      }}
    >
      <div
        ref={slidesRef}
        className="w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar scroll-smooth flex items-center lg:grid lg:place-items-center lg:overflow-visible lg:snap-none"
        onScroll={onScroll}
      >
        {displaySlides.map((s, i) => (
          <div
            key={i}
            className={`w-full shrink-0 snap-start lg:col-start-1 lg:row-start-1 lg:transition-opacity lg:duration-700 lg:ease-in-out ${
              i === index + offset ? 'opacity-100' : 'lg:opacity-0 lg:pointer-events-none'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {controls && (
        <>
          <button
            aria-label="Anterior"
            onClick={prevFn}
            className="absolute left-4 top-30 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-200 z-20 transition duration-200 cursor-pointer"
          >
            <LuChevronLeft size={24} className="text-black" />
          </button>
          <button
            aria-label="Siguiente"
            onClick={nextFn}
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
