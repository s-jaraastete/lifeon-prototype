"use client"

import React, { CSSProperties, useEffect, useRef, useState } from "react"

type Slide = {
  id: string | number
  content: React.ReactNode | ((isActive: boolean) => React.ReactNode)
}

type Props = {
  slides: Slide[]
  intervalMs?: number
  className?: string
  pauseOnHover?: boolean
  controls?: boolean
}

const HeroSlider = ({ slides, intervalMs = 5000, className, pauseOnHover = true, controls = true }: Props) => {
  const [idx, setIdx] = useState(0)
  const paused = useRef(false)
  const timer = useRef<number | null>(null)
  const progressStyle = {
    "--hero-slider-progress-duration": `${intervalMs}ms`,
  } as CSSProperties

  useEffect(() => {
    if (slides.length <= 1) return
    const start = () => {
      stop()
      timer.current = window.setInterval(() => {
        if (!paused.current) setIdx((i) => (i + 1) % slides.length)
      }, intervalMs)
    }
    const stop = () => {
      if (timer.current) {
        clearInterval(timer.current)
        timer.current = null
      }
    }
    start()
    return stop
  }, [slides.length, intervalMs])

  const onMouseEnter = () => {
    if (pauseOnHover) paused.current = true
  }
  const onMouseLeave = () => {
    if (pauseOnHover) paused.current = false
  }

  return (
    <div
      className={className ?? "relative w-full min-h-[calc(100vh-79.5px)] sm:min-h-[calc(100vh-160px)] lg:min-h-[calc(100vh-70px)] overflow-hidden bg-gray-200"}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-roledescription="carousel"
      aria-live="polite"
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
          aria-hidden={i === idx ? "false" : "true"}
        >
          {typeof s.content === 'function' ? s.content(i === idx) : s.content}
        </div>
      ))}

      {/* Indicators: light bar with active segment */}
      <div className="absolute left-1/2 bottom-8 lg:bottom-20 -translate-x-1/2 flex gap-3 items-center z-20">
        {slides.map((_, i) => {
          const active = i === idx
            if (active) {
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir al slide ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className="relative h-2 w-11 rounded-full bg-teal-100 overflow-hidden cursor-pointer"
                >
                  <span
                    key={idx}
                    className="hero-slider-progress absolute left-0 top-0 h-full w-full origin-left rounded-full bg-secondary"
                    style={progressStyle}
                  />
                </button>
              )
            }

            return (
              <button
                key={i}
                type="button"
                aria-label={`Ir al slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className="h-2.5 w-2.5 rounded-full bg-teal-100 transition-colors hover:bg-teal-300 cursor-pointer"
              />
            )
        })}
      </div>

      {/* Optional prev/next buttons */}
      {controls && (
        <>
          <button
            aria-label="Anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-md bg-black/40 text-white p-2"
            onClick={() => setIdx((i) => (i - 1 + slides.length) % slides.length)}
          >
            ‹
          </button>
          <button
            aria-label="Siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-black/40 text-white p-2"
            onClick={() => setIdx((i) => (i + 1) % slides.length)}
          >
            ›
          </button>
        </>
      )}
    </div>
  )
};

export default HeroSlider;
