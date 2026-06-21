'use client'

import Link from 'next/link'
import { BoardOverlay } from './BoardOverlay'
import type { BoardImage } from '../types'

export interface ImageGalleryProps {
  images: BoardImage[]
  selectedId?: string
  /** plan: ?file= 로 포커스(Link). */
  imageHref?: (imageId: string) => string
  /** career: 콜백으로 상세 오픈. */
  onSelect?: (imageId: string) => void
  emptyLabel?: string
}

/** 2열 썸네일 그리드 (각 썸네일에 BoardOverlay 스탬프). */
export function ImageGallery({
  images,
  selectedId,
  imageHref,
  onSelect,
  emptyLabel = '이미지가 없습니다',
}: ImageGalleryProps) {
  if (images.length === 0) {
    return <p className="px-1 py-8 text-center text-sm text-gray-500">{emptyLabel}</p>
  }
  return (
    <ul className="grid grid-cols-2 gap-3">
      {images.map((img) => {
        const selected = img.id === selectedId
        const cls = `relative block overflow-hidden rounded-md ${selected ? 'ring-2 ring-primary' : ''}`
        const inner = (
          <>
            <img src={img.imageUrl} alt="" className="aspect-square w-full object-cover" />
            <BoardOverlay rows={img.boardRows} position={img.boardPosition} />
          </>
        )
        return (
          <li key={img.id}>
            {imageHref ? (
              <Link href={imageHref(img.id)} scroll={false} className={cls}>
                {inner}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onSelect?.(img.id)}
                className={`${cls} w-full text-left`}
              >
                {inner}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
