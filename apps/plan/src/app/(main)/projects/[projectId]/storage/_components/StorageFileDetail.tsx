'use client'

import Link from 'next/link'
import { XIcon } from '@bconnect/ui'
import { formatDate } from '@bconnect/config/format'
import { useFolderImages } from '@/lib/storage/hooks'

interface StorageFileDetailProps {
  folderId: string
  fileId: string
  /** 닫기(=?file 제거) Link */
  closeHref: string
}

/**
 * plan 우측 컬럼 — 파일 상세 (포커스 시). 동산보드 메타·설명·폴더 이동 편집은 BE 저장
 * 엔드포인트가 없어 비활성 — BE 지원 시 복원 (features ImageBoardDetail 재사용).
 */
export function StorageFileDetail({ folderId, fileId, closeHref }: StorageFileDetailProps) {
  const { data: images } = useFolderImages(folderId)
  const image = images?.find((i) => i.id === fileId)

  if (!image) {
    return (
      <div className="flex items-center justify-between p-6">
        <p className="text-sm text-gray-500">파일을 찾을 수 없습니다.</p>
        <Link href={closeHref} aria-label="닫기" className="text-gray-400 hover:text-gray-600">
          <XIcon size={18} />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-end">
        <Link href={closeHref} aria-label="상세 닫기" className="text-gray-400 hover:text-gray-600">
          <XIcon size={18} />
        </Link>
      </div>
      <div className="overflow-hidden rounded-md">
        <img src={image.imageUrl} alt="" className="aspect-square w-full object-cover" />
      </div>
      <div className="min-w-0">
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
