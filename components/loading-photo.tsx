'use client'

import Image from 'next/image'
import { ImageLoader, useImageLoaded } from '@/components/image-loader'

export function LoadingPhoto({ src, alt }: { src: string; alt: string }) {
  const { loaded, ...handlers } = useImageLoaded()
  return (
    <div className="relative mx-auto mt-8 h-64 w-64 rounded-full border border-hairline sm:mx-0">
      {!loaded && <ImageLoader className="absolute inset-0 m-auto" />}
      <Image
        src={src}
        alt={alt}
        width={256}
        height={256}
        priority
        className={`h-full w-full rounded-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        {...handlers}
      />
    </div>
  )
}
