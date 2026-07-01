'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast, XIcon } from '@bconnect/ui'
import { BoardOverlay, ImageBoardDetail } from '@bconnect/features'
import type { BoardPosition, BoardRow } from '@bconnect/features'
import { useFolderImages, useFolders, useStorageMutations } from '@/lib/storage-mock/hooks'

interface StorageFileDetailProps {
  projectId: string
  folderId: string
  fileId: string
  /** 닫기(=?file 제거) Link */
  closeHref: string
}

/**
 * plan 우측 컬럼 — 파일 상세/편집 (포커스 시). 동산보드 메타·폴더·설명 즉시 편집 + 설명 아래 저장.
 * fileId 변경 시 부모가 key 로 리마운트 → 드래프트 초기화.
 */
export function StorageFileDetail({
  projectId,
  folderId,
  fileId,
  closeHref,
}: StorageFileDetailProps) {
  const { data: images } = useFolderImages(folderId)
  const { data: folders } = useFolders(projectId)
  const { updateImage, moveImage } = useStorageMutations()
  const { toast } = useToast()

  const image = images?.find((i) => i.id === fileId)
  const [rows, setRows] = useState<BoardRow[]>(image?.boardRows ?? [])
  const [description, setDescription] = useState(image?.description ?? '')
  const [position, setPosition] = useState<BoardPosition>(image?.boardPosition ?? 'tl')
  const [targetFolder, setTargetFolder] = useState(image?.folderId ?? folderId)

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

  const submit = () => {
    updateImage(image.id, { boardRows: rows, description, boardPosition: position })
    if (targetFolder !== image.folderId) moveImage(image.id, targetFolder)
    toast({ title: '저장되었어요' })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-end">
        <Link href={closeHref} aria-label="상세 닫기" className="text-gray-400 hover:text-gray-600">
          <XIcon size={18} />
        </Link>
      </div>
      <div className="relative overflow-hidden rounded-md">
        <img src={image.imageUrl} alt="" className="aspect-square w-full object-cover" />
        <BoardOverlay rows={rows} position={position} size="md" />
      </div>
      <ImageBoardDetail
        image={{
          ...image,
          boardRows: rows,
          description,
          boardPosition: position,
          folderId: targetFolder,
        }}
        folders={folders ?? []}
        onChangeRows={setRows}
        onChangePosition={setPosition}
        onChangeDescription={setDescription}
        onMoveFolder={setTargetFolder}
        onSubmit={submit}
        showPositionPicker
        submitLabel="저장"
      />
    </div>
  )
}
