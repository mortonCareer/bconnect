'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { Fab, ImageUploadIcon, Tab, TopBar } from '@bconnect/ui'
import { FolderImagesView } from '@bconnect/features'
import { useFolder, useFolderImages } from '@/lib/storage-mock/hooks'
import { useUploadStore } from '@/app/(main)/storage/upload/_store/upload-store'
import { CareerMemoTab } from './CareerMemoTab'
import { CareerFileDetail } from './CareerFileDetail'

const MIN_COLS = 2
const MAX_COLS = 5
const clampCols = (n: number) => Math.min(MAX_COLS, Math.max(MIN_COLS, n))

/** career 폴더 화면 — 고정 앱바+Tab + 갤러리(핀치/Ctrl휠 줌)/메모 + 업로드 FAB(OS 다중선택). ?file= 시 캐러셀 파일상세. */
export function CareerFolderView({ folderId }: { folderId: string }) {
  const router = useRouter()
  const { data: folder } = useFolder(folderId)
  const { data: images, isLoading, isError } = useFolderImages(folderId)
  const { setFiles, setTargetFolder } = useUploadStore()
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum<'images' | 'memo'>(['images', 'memo']).withDefault('images')
  )
  // ?file 은 push (뒤로가기로 갤러리 복귀 — replace 아님)
  const [file, setFile] = useQueryState('file', parseAsString.withOptions({ history: 'push' }))
  const [columns, setColumns] = useState(3)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const lastPinch = useRef(0)
  const lastZoomAt = useRef(0)

  const title = folder?.title ?? '폴더'
  const onBack = () => {
    if (file) setFile(null)
    else router.back()
  }

  // 데스크톱 Ctrl+휠 줌 — passive:false 로 브라우저 확대 막고 열 수 조정
  useEffect(() => {
    const el = galleryRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const now = Date.now()
      if (now - lastZoomAt.current < 120) return
      lastZoomAt.current = now
      setColumns((c) => clampCols(e.deltaY < 0 ? c - 1 : c + 1))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // 모바일 핀치 줌 (두 손가락) — 벌리면 확대(열↓), 오므리면 축소(열↑)
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return
    const [a, b] = [e.touches[0], e.touches[1]]
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    if (lastPinch.current === 0) {
      lastPinch.current = dist
      return
    }
    const delta = dist - lastPinch.current
    if (Math.abs(delta) > 40) {
      setColumns((c) => clampCols(delta > 0 ? c - 1 : c + 1))
      lastPinch.current = dist
    }
  }
  const resetPinch = () => {
    lastPinch.current = 0
  }

  // 업로드 FAB → OS 파일 선택기 직접 호출. 명명 함수로 분리(인라인 router.push 룰 회피).
  const handlePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (picked.length === 0) return
    setFiles(picked)
    setTargetFolder(folderId)
    router.push('/storage/upload/board')
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-30 bg-white">
        <TopBar variant="default" title={title} showAction={false} showBack onBack={onBack} />
        {!file && (
          <Tab
            items={[
              { key: 'images', label: '이미지' },
              { key: 'memo', label: '메모' },
            ]}
            activeKey={tab}
            onChange={(key) => setTab(key === 'memo' ? 'memo' : 'images')}
          />
        )}
      </div>

      {file ? (
        <CareerFileDetail
          folderId={folderId}
          selectedId={file}
          onSelectImage={(id) => setFile(id)}
          onClose={() => setFile(null)}
        />
      ) : tab === 'images' ? (
        <>
          <div
            ref={galleryRef}
            onTouchMove={onTouchMove}
            onTouchEnd={resetPinch}
            className="touch-pan-y p-4"
          >
            <FolderImagesView
              images={images ?? []}
              isLoading={isLoading}
              isError={isError}
              columns={columns}
              onSelect={(id) => setFile(id)}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePicked}
            className="sr-only"
            aria-hidden
            tabIndex={-1}
          />
          <Fab
            aria-label="이미지 업로드"
            onClick={() => fileInputRef.current?.click()}
            icon={<ImageUploadIcon size={22} />}
          />
        </>
      ) : (
        <div className="p-4">
          <CareerMemoTab folderId={folderId} />
        </div>
      )}
    </div>
  )
}
