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

  // Refs and state to measure active slide height so wrapper keeps document flow
  const slideRefs = useRef<Array<HTMLDivElement | null>>([])
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const el = slideRefs.current[index]
    if (el) setContainerHeight(el.offsetHeight)
    else setContainerHeight(undefined)
  }, [index, slides])

  useEffect(() => {
    const onResize = () => {
      const el = slideRefs.current[index]
      if (el) setContainerHeight(el.offsetHeight)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [index])

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      const el = slideRefs.current[index]
      if (el) setContainerHeight(el.offsetHeight)
    })
    slideRefs.current.forEach((el) => {
      if (el) ro.observe(el)
    })
    return () => ro.disconnect()
  }, [slides, index])

  return (
    <div
      className={`relative w-full ${className}`}
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
        className="relative w-full"
        style={containerHeight ? { height: containerHeight } : { minHeight: 240 }}
      >
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
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
        <div className="absolute left-1/2 bottom-6 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`h-2 w-8 rounded-full overflow-hidden bg-teal-100 ${i === index ? 'bg-secondary' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
