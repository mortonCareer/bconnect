'use client'

import { useEffect, useState } from 'react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@bconnect/ui'
import { formatDate } from '@bconnect/config/format'
import { useFolderImages } from '@/lib/storage/hooks'

interface CareerFileDetailProps {
  folderId: string
  selectedId: string
  /** 캐러셀 스와이프로 다른 사진 선택 → ?file 갱신(push) */
  onSelectImage: (id: string) => void
}

/**
 * career 파일 상세 — 좌우 스와이프 캐러셀로 사진 이동. 동산보드 메타·설명·폴더 이동
 * 편집은 BE 저장 엔드포인트가 없어 비활성 — BE 지원 시 복원 (features ImageBoardDetail 재사용).
 */
export function CareerFileDetail({ folderId, selectedId, onSelectImage }: CareerFileDetailProps) {
  const { data: images } = useFolderImages(folderId)

  const list = images ?? []
  const index = Math.max(
    0,
    list.findIndex((i) => i.id === selectedId)
  )
  const image = list[index]

  const [api, setApi] = useState<CarouselApi>()
  // 캐러셀 스와이프 → ?file 동기화
  useEffect(() => {
    if (!api) return
    const onSelect = () => {
      const id = list[api.selectedScrollSnap()]?.id
      if (id && id !== selectedId) onSelectImage(id)
    }
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api, list, selectedId, onSelectImage])
  // ?file 외부 변경 → 캐러셀 동기화
  useEffect(() => {
    if (api && api.selectedScrollSnap() !== index) api.scrollTo(index, true)
  }, [api, index])

  if (!image) {
    return <p className="p-4 text-sm text-gray-500">파일을 찾을 수 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Carousel setApi={setApi} opts={{ startIndex: index }} className="w-full">
        <CarouselContent className="ml-0">
          {list.map((img) => (
            <CarouselItem key={img.id} className="pl-0">
              <div className="overflow-hidden rounded-md">
                <img src={img.imageUrl} alt="" className="aspect-square w-full object-cover" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <p className="text-center text-xs text-gray-400">
        {index + 1} / {list.length}
      </p>
      <div className="min-w-0 text-center">
        {image.filename && (
          <p className="truncate text-sm font-medium text-gray-900">{image.filename}</p>
        )}
        {image.createdAt && (
          <p className="mt-0.5 text-xs text-gray-400">{formatDate(image.createdAt)}</p>
        )}
      </div>
    </div>
  )
}
