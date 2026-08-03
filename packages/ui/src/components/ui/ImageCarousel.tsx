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
  /** 이미지 프레임(높이·모서리·배경) 오버라이드 — 전체폭 카드는 'rounded-none' 등 */
  imageClassName?: string
  /** 외부 CDN 핫링크 차단 회피용 (예: 네이버 크롤 이미지는 'no-referrer' 필요) */
  referrerPolicy?: React.HTMLAttributeReferrerPolicy
}

/**
 * 다중 이미지 좌우 스와이프 캐러셀 + 선택 인덱스 점 (인스타그램 스타일).
 * 인덱스 점은 이미지 내부 하단(아래에서 10px) 중앙에 오버레이.
 * 이미지 1장이면 캐러셀/점 없이 단일 이미지로 렌더.
 *
 * 포인터가 없는 사용자를 위해 좌우 방향키로도 넘길 수 있다 — 넘김 수단이 드래그뿐이면
 * 2번째 이후 이미지에 도달할 방법이 없다. cursor 는 상속 속성이라 루트에 걸면
 * embla 뷰포트(shadcn primitive 가 className 을 고정)까지 내려간다.
 */
export function ImageCarousel({
  images,
  alt,
  className,
  imageClassName,
  referrerPolicy,
}: ImageCarouselProps) {
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
      <div
        className={cn('relative h-55 w-full overflow-hidden rounded-sm', className, imageClassName)}
      >
        <img
          src={images[0]}
          alt={alt}
          referrerPolicy={referrerPolicy}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <Carousel
      setApi={setApi}
      tabIndex={0}
      aria-label={alt ? `${alt} 이미지 ${count || images.length}장` : '이미지 캐러셀'}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          api?.scrollPrev()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          api?.scrollNext()
        }
      }}
      className={cn(
        'w-full cursor-grab active:cursor-grabbing',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
        className
      )}
    >
      <CarouselContent className="ml-0">
        {images.map((src, i) => (
          <CarouselItem key={i} className="pl-0">
            <div className={cn('relative h-55 w-full overflow-hidden rounded-sm', imageClassName)}>
              <img
                src={src}
                alt={alt}
                referrerPolicy={referrerPolicy}
                className="h-full w-full object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div
        className="absolute bottom-[10px] left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/30 px-2 py-1"
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
