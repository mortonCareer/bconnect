'use client'

import { useEffect, useState } from 'react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi, useToast } from '@bconnect/ui'
import { BoardOverlay, ImageBoardDetail } from '@bconnect/features'
import type { BoardPosition, BoardRow } from '@bconnect/features'
import { useAllFolders, useFolderImages, useStorageMutations } from '@/lib/storage-mock/hooks'

interface CareerFileDetailProps {
  folderId: string
  selectedId: string
  /** 캐러셀 스와이프로 다른 사진 선택 → ?file 갱신(push) */
  onSelectImage: (id: string) => void
  /** 저장/닫기 후 갤러리 복귀(?file 제거) */
  onClose: () => void
}

/** career 파일 상세 — 좌우 스와이프 캐러셀로 사진 이동 + 동산보드 편집 + 저장 후 목록 복귀. */
export function CareerFileDetail({
  folderId,
  selectedId,
  onSelectImage,
  onClose,
}: CareerFileDetailProps) {
  const { data: images } = useFolderImages(folderId)
  const { data: folders } = useAllFolders()
  const { updateImage, moveImage } = useStorageMutations()
  const { toast } = useToast()

  const list = images ?? []
  const index = Math.max(
    0,
    list.findIndex((i) => i.id === selectedId)
  )
  const image = list[index]

  // 드래프트 — selectedId 변경 시 재초기화(remount 없이, prevId 패턴)
  const [rows, setRows] = useState<BoardRow[]>(image?.boardRows ?? [])
  const [description, setDescription] = useState(image?.description ?? '')
  const [position, setPosition] = useState<BoardPosition>(image?.boardPosition ?? 'tl')
  const [targetFolder, setTargetFolder] = useState(image?.folderId ?? folderId)
  const [prevId, setPrevId] = useState(selectedId)
  if (selectedId !== prevId) {
    setPrevId(selectedId)
    setRows(image?.boardRows ?? [])
    setDescription(image?.description ?? '')
    setPosition(image?.boardPosition ?? 'tl')
    setTargetFolder(image?.folderId ?? folderId)
  }

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

  const submit = () => {
    updateImage(image.id, { boardRows: rows, description, boardPosition: position })
    if (targetFolder !== image.folderId) moveImage(image.id, targetFolder)
    toast({ title: '저장되었어요' })
    onClose()
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Carousel setApi={setApi} opts={{ startIndex: index }} className="w-full">
        <CarouselContent className="ml-0">
          {list.map((img) => {
            const current = img.id === image.id
            return (
              <CarouselItem key={img.id} className="pl-0">
                <div className="relative overflow-hidden rounded-md">
                  <img src={img.imageUrl} alt="" className="aspect-square w-full object-cover" />
                  <BoardOverlay
                    rows={current ? rows : img.boardRows}
                    position={current ? position : img.boardPosition}
                    size="md"
                  />
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
      <p className="text-center text-xs text-gray-400">
        {index + 1} / {list.length}
      </p>
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
