import { ImageGallery } from './_parts/ImageGallery'
import type { BoardImage } from './types'

export interface FolderImagesViewProps {
  images: BoardImage[]
  isLoading: boolean
  isError: boolean
  selectedId?: string
  imageHref?: (imageId: string) => string
  onSelect?: (imageId: string) => void
  columns?: number
  emptyLabel?: string
}

/** 폴더 내 이미지 갤러리 뷰. career 이미지 탭·plan 좌측 컬럼 공용. */
export function FolderImagesView({
  images,
  isLoading,
  isError,
  selectedId,
  imageHref,
  onSelect,
  columns,
  emptyLabel,
}: FolderImagesViewProps) {
  if (isLoading) {
    return <p className="px-1 py-8 text-center text-sm text-gray-500">불러오는 중…</p>
  }
  if (isError) {
    return (
      <p className="px-1 py-8 text-center text-sm text-gray-500">이미지를 불러올 수 없습니다</p>
    )
  }
  return (
    <ImageGallery
      images={images}
      selectedId={selectedId}
      imageHref={imageHref}
      onSelect={onSelect}
      columns={columns}
      emptyLabel={emptyLabel}
    />
  )
}
