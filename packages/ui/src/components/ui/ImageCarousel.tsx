/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1597-17389
 */
'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from './shadcn/carousel'

export interface ImageCarouselProps {
  images: string[]
  alt?: string
  className?: string
}

/**
 * 다중 이미지 좌우 스와이프 캐러셀 + 선택 인덱스 점 (인스타그램 스타일).
 * 인덱스 점은 이미지 내부 하단(아래에서 10px) 중앙에 오버레이.
 * 이미지 1장이면 캐러셀/점 없이 단일 이미지로 렌더.
 */
export function ImageCarousel({ images, alt, className }: ImageCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [selected, setSelected] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) return
    const sync = () => {
      setCount(api.scrollSnapList().length)
      setSelected(api.selectedScrollSnap())
    }
    sync()
    api.on('select', sync)
    api.on('reInit', sync)
    return () => {
      api.off('select', sync)
      api.off('reInit', sync)
    }
  }, [api])

  if (images.length <= 1) {
    return (
      <div className={cn('relative h-55 w-full overflow-hidden rounded-sm', className)}>
        <img src={images[0]} alt={alt} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <Carousel setApi={setApi} className={cn('w-full', className)}>
      <CarouselContent className="ml-0">
        {images.map((src, i) => (
          <CarouselItem key={i} className="pl-0">
            <div className="relative h-55 w-full overflow-hidden rounded-sm">
              <img src={src} alt={alt} className="h-full w-full object-cover" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div
        className="absolute bottom-[10px] left-1/2 flex -translate-x-1/2 items-center gap-1 drop-shadow-[0_0_2px_rgba(0,0,0,0.55)]"
        aria-hidden
      >
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-[5px] rounded-full transition-all',
              i === selected ? 'w-[11px] bg-primary' : 'w-[5px] bg-[#e5e5e5]'
            )}
          />
        ))}
      </div>
    </Carousel>
  )
}
