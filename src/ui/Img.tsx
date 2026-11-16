import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { photoUrl } from '@/lib/images'

type ImgProps = {
  id: string
  alt: string
  width: number
  height?: number
  className?: string
  priority?: boolean
  crop?: 'faces' | 'entropy' | 'edges'
}

/** Unsplash image with retina srcset and a soft fade-in once decoded. */
export function Img({ id, alt, width, height, className, priority, crop }: ImgProps) {
  const ref = useRef<HTMLImageElement>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoadedId(id)
  }, [id])

  const src = photoUrl(id, width, height, { crop })
  const retina = photoUrl(id, width * 2, height ? height * 2 : undefined, { crop })

  return (
    <img
      ref={ref}
      src={src}
      srcSet={`${src} 1x, ${retina} 2x`}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onLoad={() => setLoadedId(id)}
      className={cn(
        'select-none object-cover transition-opacity duration-700 ease-out',
        loadedId === id ? 'opacity-100' : 'opacity-0',
        className,
      )}
    />
  )
}
