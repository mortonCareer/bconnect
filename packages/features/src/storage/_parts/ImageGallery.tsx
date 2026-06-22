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
  /** 그리드 열 수 (기본 3, 줌으로 2~5 변경). */
  columns?: number
  emptyLabel?: string
}

const COLS_CLASS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
}

/** 썸네일 그리드 (각 썸네일에 BoardOverlay 스탬프). 기본 3열. */
export function ImageGallery({
  images,
  selectedId,
  imageHref,
  onSelect,
  columns = 3,
  emptyLabel = '이미지가 없습니다',
}: ImageGalleryProps) {
  if (images.length === 0) {
    return <p className="px-1 py-8 text-center text-sm text-gray-500">{emptyLabel}</p>
  }
  const colsClass = COLS_CLASS[Math.min(5, Math.max(2, columns))] ?? COLS_CLASS[3]
  return (
    <ul className={`grid gap-2 ${colsClass}`}>
      {images.map((img) => {
        const selected = img.id === selectedId
        const cls = `group relative block cursor-pointer overflow-hidden rounded-md ${selected ? 'ring-2 ring-primary' : ''}`
        const inner = (
          <>
            <img src={img.imageUrl} alt="" className="aspect-square w-full object-cover" />
            <BoardOverlay rows={img.boardRows} position={img.boardPosition} />
            {/* 호버 색 변경 효과 */}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
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
