"use client"

import React, { CSSProperties, useLayoutEffect, useEffect, useRef, useState } from "react"

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
  const slidesRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)
  const progressStyle = {
    "--hero-slider-progress-duration": `${intervalMs}ms`,
  } as CSSProperties

  const hasClones = slides.length > 1
  const displaySlides = hasClones ? [slides[slides.length - 1], ...slides, slides[0]] : slides
  const offset = hasClones ? 1 : 0

  const jumpTo = (targetScrollLeft: number) => {
    const el = slidesRef.current
    if (!el) return
    isScrolling.current = true
    el.style.scrollBehavior = "auto"
    el.scrollLeft = targetScrollLeft
    el.style.scrollBehavior = ""
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
    if (slides.length <= 1) return
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
    timer.current = window.setInterval(() => {
      if (!paused.current) {
        setIdx(prev => {
          const next = (prev + 1) % slides.length
          setTimeout(() => scrollToSlide(next), 0)
          return next
        })
      }
    }, intervalMs)
  }

  useLayoutEffect(() => {
    const el = slidesRef.current
    if (!el) return
    if (hasClones) {
      el.scrollLeft = el.clientWidth
    }
    const handleScrollEnd = () => {
      if (isScrolling.current || !hasClones) return
      const slideWidth = el.clientWidth
      const rawIdx = Math.round(el.scrollLeft / slideWidth)
      if (rawIdx === 0) {
        jumpTo(slides.length * slideWidth)
        setIdx(slides.length - 1)
        restartAutoplay()
        return
      }
      if (rawIdx === slides.length + 1) {
        jumpTo(slideWidth)
        setIdx(0)
        restartAutoplay()
      }
    }
    el.addEventListener("scrollend", handleScrollEnd)
    return () => el.removeEventListener("scrollend", handleScrollEnd)
  }, [hasClones])

  useEffect(() => {
    if (slides.length <= 1) return
    const start = () => {
      stop()
      timer.current = window.setInterval(() => {
        if (!paused.current) {
          setIdx(prev => {
            const next = (prev + 1) % slides.length
            setTimeout(() => scrollToSlide(next), 0)
            return next
          })
        }
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

  const onScroll = () => {
    if (isScrolling.current || !slidesRef.current) return
    const rawIdx = Math.round(slidesRef.current.scrollLeft / slidesRef.current.clientWidth)
    const newIdx = rawIdx - offset
    if (newIdx >= 0 && newIdx < slides.length && newIdx !== idx) {
      setIdx(newIdx)
      restartAutoplay()
    }
  }

  const goTo = (i: number) => {
    scrollToSlide(i)
    setIdx(i)
    restartAutoplay()
  }

  const onMouseEnter = () => {
    if (pauseOnHover) paused.current = true
  }
  const onMouseLeave = () => {
    if (pauseOnHover) paused.current = false
  }

  return (
    <div
      className={className ?? "relative w-full overflow-hidden bg-gray-200"}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-roledescription="carousel"
      aria-live="polite"
    >
      <div
        ref={slidesRef}
        className="w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar scroll-smooth flex items-center pt-5 lg:pt-0 lg:grid lg:grid-cols-1 lg:place-items-center lg:overflow-visible lg:snap-none lg:min-h-[calc(100vh-70px)]"
        onScroll={onScroll}
      >
        {displaySlides.map((s, i) => (
          <div
            key={i}
            className={`w-full shrink-0 snap-start lg:col-start-1 lg:row-start-1 lg:transition-opacity lg:duration-700 lg:ease-in-out ${
              i === idx + offset ? "opacity-100" : "lg:opacity-0 lg:pointer-events-none"
            }`}
          >
            {typeof s.content === 'function' ? s.content(i === idx + offset) : s.content}
          </div>
        ))}
      </div>

      <div className="absolute left-1/2 bottom-8 lg:bottom-20 -translate-x-1/2 flex gap-3 items-center z-20">
        {slides.map((_, i) => {
          const active = i === idx
            if (active) {
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir al slide ${i + 1}`}
                  onClick={() => goTo(i)}
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
                onClick={() => goTo(i)}
                className="h-2.5 w-2.5 rounded-full bg-teal-100 transition-colors hover:bg-teal-300 cursor-pointer"
              />
            )
        })}
      </div>

      {controls && (
        <>
          <button
            aria-label="Anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-md bg-black/40 text-white p-2"
            onClick={() => goTo((idx - 1 + slides.length) % slides.length)}
          >
            ‹
          </button>
          <button
            aria-label="Siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-black/40 text-white p-2"
            onClick={() => goTo((idx + 1) % slides.length)}
          >
            ›
          </button>
        </>
      )}
    </div>
  )
};

export default HeroSlider
