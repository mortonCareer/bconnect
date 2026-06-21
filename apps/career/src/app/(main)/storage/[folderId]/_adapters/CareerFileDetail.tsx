'use client'

import { useState } from 'react'
import { useToast } from '@bconnect/ui'
import { BoardOverlay, ImageBoardDetail } from '@bconnect/features'
import type { BoardPosition, BoardRow } from '@bconnect/features'
import { useAllFolders, useFolderImages, useStorageMutations } from '@/lib/storage-mock/hooks'

/** career 파일 상세/편집 (?file=, 풀스크린). 동산보드 메타·위치·폴더·설명 편집 + 저장. */
export function CareerFileDetail({ folderId, fileId }: { folderId: string; fileId: string }) {
  const { data: images } = useFolderImages(folderId)
  const { data: folders } = useAllFolders()
  const { updateImage, moveImage } = useStorageMutations()
  const { toast } = useToast()

  const image = images?.find((i) => i.id === fileId)
  const [rows, setRows] = useState<BoardRow[]>(image?.boardRows ?? [])
  const [description, setDescription] = useState(image?.description ?? '')
  const [position, setPosition] = useState<BoardPosition>(image?.boardPosition ?? 'tl')
  const [targetFolder, setTargetFolder] = useState(image?.folderId ?? folderId)

  if (!image) {
    return <p className="p-4 text-sm text-gray-500">파일을 찾을 수 없습니다.</p>
  }

  const submit = () => {
    updateImage(image.id, { boardRows: rows, description, boardPosition: position })
    if (targetFolder !== image.folderId) moveImage(image.id, targetFolder)
    toast({ title: '저장되었어요' })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
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
