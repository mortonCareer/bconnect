/**
 * @figma-scaffold 동산보드 업로드 3단계 사진 정보 입력 — 사진별 배치/메타/폴더/설명, 와이어프레임만 (SPRINT4 pre-build, 기획 node-id=1095-424)
 */
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronIcon, TopBar } from '@bconnect/ui'
import { BoardOverlay, ImageBoardDetail } from '@bconnect/features'
import type { BoardPosition } from '@bconnect/features'
import { useAllFolders, useStorageMutations } from '@/lib/storage-mock/hooks'
import { useUploadStore } from '../_store/upload-store'

export default function UploadPhotosPage() {
  const router = useRouter()
  const { files, sharedRows, perPhoto, targetFolderId, setPerPhoto, reset } = useUploadStore()
  const { data: folders } = useAllFolders()
  const { addImages } = useStorageMutations()
  const urls = useMemo(
    () => files.map((f) => URL.createObjectURL(f)), // TODO(orval): 업로드 후 CloudFront URL 로 교체. revoke 생략(누수, 와이어프레임 허용).
    [files]
  )
  const [cursor, setCursor] = useState(0)

  const active = files.map((_, i) => i).filter((i) => !perPhoto[i]?.deselected)
  const safeCursor = Math.min(cursor, Math.max(0, active.length - 1))
  const idx = active[safeCursor] ?? -1

  const per = (i: number) =>
    perPhoto[i] ?? {
      rows: sharedRows,
      position: 'tl' as BoardPosition,
      description: '',
      folderId: targetFolderId,
      deselected: false,
    }

  const complete = () => {
    active.forEach((i) => {
      const p = per(i)
      const fid = p.folderId ?? targetFolderId
      if (!fid) return
      addImages(fid, [
        {
          imageUrl: urls[i],
          boardRows: p.rows,
          boardPosition: p.position,
          description: p.description,
        },
      ])
    })
    reset()
    router.push(targetFolderId ? `/storage/${targetFolderId}` : '/storage')
  }

  if (idx < 0) {
    return (
      <>
        <TopBar
          variant="default"
          title="사진 정보 입력"
          showBack
          onBack={() => router.back()}
          showAction={false}
        />
        <p className="p-8 text-center text-sm text-gray-500">선택된 사진이 없습니다.</p>
      </>
    )
  }

  const p = per(idx)
  const detailImage = {
    id: `upload-${idx}`,
    folderId: p.folderId ?? targetFolderId ?? '',
    imageUrl: urls[idx],
    boardRows: p.rows,
    boardPosition: p.position,
    description: p.description,
    createdAt: '',
  }

  return (
    <>
      <TopBar
        variant="default"
        title="사진 정보 입력"
        showBack
        onBack={() => router.back()}
        showAction
        actionLabel="완료"
        onAction={complete}
      />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="이전 사진"
            onClick={() => setCursor((c) => Math.max(0, c - 1))}
            disabled={safeCursor === 0}
            className="shrink-0 text-gray-400 disabled:opacity-30"
          >
            <ChevronIcon direction="left" size={24} />
          </button>
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-md">
            <img src={urls[idx]} alt="" className="aspect-square w-full object-cover" />
            <BoardOverlay rows={p.rows} position={p.position} size="md" />
          </div>
          <button
            type="button"
            aria-label="다음 사진"
            onClick={() => setCursor((c) => Math.min(active.length - 1, c + 1))}
            disabled={safeCursor >= active.length - 1}
            className="shrink-0 text-gray-400 disabled:opacity-30"
          >
            <ChevronIcon direction="right" size={24} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400">
          {safeCursor + 1} / {active.length}
        </p>
        <ImageBoardDetail
          key={idx}
          image={detailImage}
          folders={folders ?? []}
          onChangeRows={(rows) => setPerPhoto(idx, { rows })}
          onChangePosition={(position) => setPerPhoto(idx, { position })}
          onChangeDescription={(description) => setPerPhoto(idx, { description })}
          onMoveFolder={(folderId) => setPerPhoto(idx, { folderId })}
          onDeselect={() => {
            setPerPhoto(idx, { deselected: true })
            setCursor((c) => Math.max(0, c - 1))
          }}
          showPositionPicker
          submitLabel="완료"
        />
      </div>
    </>
  )
}
