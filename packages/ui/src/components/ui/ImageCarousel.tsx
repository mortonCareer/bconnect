/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1597-17389
 */
'use client'

import * as React from 'react'
import { ChevronIcon } from '../../icons'
import { cn } from '../../lib/utils'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from './shadcn/carousel'

export interface ImageCarouselProps {
  images: string[]
  alt?: string
  className?: string
}

const navButtonClass =
  'absolute top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white/90 active:scale-95'

/**
 * 다중 이미지 좌우 스와이프 캐러셀 + 이미지 내 전/후 버튼 + 선택 인덱스 점 (인스타그램 스타일).
 * 이미지 1장이면 캐러셀/버튼/점 없이 단일 이미지로 렌더.
 */
export function ImageCarousel({ images, alt, className }: ImageCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [selected, setSelected] = React.useState(0)
  const [count, setCount] = React.useState(0)
  const [canPrev, setCanPrev] = React.useState(false)
  const [canNext, setCanNext] = React.useState(false)

  React.useEffect(() => {
    if (!api) return
    const sync = () => {
      setCount(api.scrollSnapList().length)
      setSelected(api.selectedScrollSnap())
      setCanPrev(api.canScrollPrev())
      setCanNext(api.canScrollNext())
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
    <div className={cn('flex w-full flex-col items-center gap-2', className)}>
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent className="ml-0">
          {images.map((src, i) => (
            <CarouselItem key={i} className="pl-0">
              <div className="relative h-55 w-full overflow-hidden rounded-sm">
                <img src={src} alt={alt} className="h-full w-full object-cover" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {canPrev && (
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            className={cn(navButtonClass, 'left-2')}
            aria-label="이전 이미지"
          >
            <ChevronIcon direction="left" size={18} />
          </button>
        )}
        {canNext && (
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            className={cn(navButtonClass, 'right-2')}
            aria-label="다음 이미지"
          >
            <ChevronIcon direction="right" size={18} />
          </button>
        )}
      </Carousel>
      <div className="flex items-center gap-1" aria-hidden>
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
    </div>
  )
}
