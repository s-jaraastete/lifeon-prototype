'use client'

import useAuthenticatedMediaSrc from '@/components/reusable/useAuthenticatedMediaSrc'
import { ImgHTMLAttributes } from 'react'

type AuthenticatedImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  authSrc: string | null
}

const AuthenticatedImg = ({ authSrc, alt, ...imgProps }: AuthenticatedImgProps) => {
  const src = useAuthenticatedMediaSrc(authSrc)

  if (!src) {
    return (
      <div
        className={imgProps.className}
        aria-label={alt ?? 'Cargando imagen'}
        style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
      />
    )
  }

  return <img src={src} alt={alt} {...imgProps} />
}

export default AuthenticatedImg
