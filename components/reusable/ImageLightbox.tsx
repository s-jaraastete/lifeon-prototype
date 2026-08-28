'use client'

import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/solid'
import useAuthenticatedMediaSrc from '@/components/reusable/useAuthenticatedMediaSrc'
import { useCallback, useEffect } from 'react'

type GenericImage = {
  name: string | null,
  image: string,
}

type ImageLightboxProps<T extends GenericImage> = {
  images: T[]
  current: T | null
  setCurrent: (image: T | null) => void
}

const ImageLightbox = <T extends GenericImage>(props: ImageLightboxProps<T>) => {
  const { images, current, setCurrent } = props
  const index = current ? images.indexOf(current) : -1
  const authenticatedSrc = useAuthenticatedMediaSrc(current?.image ?? null)

  const close = useCallback(() => setCurrent(null), [setCurrent])

  const goPrev = useCallback(() => {
    if (index > 0) setCurrent(images[index - 1])
  }, [index, images, setCurrent])

  const goNext = useCallback(() => {
    if (index < images.length - 1) setCurrent(images[index + 1])
  }, [index, images, setCurrent])

  useEffect(() => {
    if (!current) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [current, goPrev, goNext])

  return (
    <Dialog open={current !== null} as='div' className='relative z-50 focus:outline-none' onClose={close}>
      <DialogBackdrop
        transition
        className='fixed inset-0 bg-black/85 transition duration-200 ease-out data-[closed]:opacity-0'
      />

      <div className='fixed inset-0'>
        {/* DialogPanel fills screen and acts as the backdrop click target */}
        <DialogPanel
          transition
          className='relative w-full h-full flex flex-col items-center justify-center gap-3 px-20 cursor-pointer transition duration-200 ease-out data-[closed]:opacity-0 data-[closed]:scale-95'
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >

          {/* Close button — top right */}
          <button
            className='absolute top-4 right-4 z-10 text-white bg-white/10 rounded-full p-1.5 hover:bg-white/25 transition-colors cursor-pointer'
            onClick={(e) => { e.stopPropagation(); close(); }}
          >
            <XMarkIcon className='size-6' />
          </button>

          {/* Prev arrow — left edge, vertically centered */}
          <button
            className='absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-white/10 rounded-full p-2 hover:bg-white/25 transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer'
            disabled={index <= 0}
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          >
            <ChevronLeftIcon className='size-8' />
          </button>

          {/* Next arrow — right edge, vertically centered */}
          <button
            className='absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-white/10 rounded-full p-2 hover:bg-white/25 transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer'
            disabled={index >= images.length - 1}
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          >
            <ChevronRightIcon className='size-8' />
          </button>

          {/* Image */}
          {current && authenticatedSrc && (
            <img
              src={authenticatedSrc}
              alt={current.name ?? 'imagen'}
              className='max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl cursor-default'
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Caption + counter */}
          <div className='flex flex-col items-center gap-1' onClick={(e) => e.stopPropagation()}>
            {current?.name && (
              <p className='text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded'>
                {current.name}
              </p>
            )}
            {images.length > 1 && (
              <p className='text-white/60 text-xs'>
                {index + 1} / {images.length}
              </p>
            )}
          </div>

        </DialogPanel>
      </div>
    </Dialog>
  )
}

export default ImageLightbox
