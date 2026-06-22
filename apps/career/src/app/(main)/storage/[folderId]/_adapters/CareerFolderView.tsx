'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { Fab, ImageUploadIcon, Tab, TopBar } from '@bconnect/ui'
import { FolderImagesView } from '@bconnect/features'
import { useFolder, useFolderImages } from '@/lib/storage-mock/hooks'
import { useUploadStore } from '@/app/(main)/storage/upload/_store/upload-store'
import { CareerMemoTab } from './CareerMemoTab'
import { CareerFileDetail } from './CareerFileDetail'

/** career 폴더 화면 — 고정 앱바+Tab + 갤러리(줌)/메모 + 업로드 FAB(OS 다중선택). ?file= 시 캐러셀 파일상세. */
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

  const title = folder?.title ?? '폴더'
  const onBack = () => {
    if (file) setFile(null)
    else router.back()
  }

  // 업로드 FAB → OS 파일 선택기 직접 호출(별도 선택 페이지 없음). 명명 함수로 분리(인라인 router.push 룰 회피).
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
          <div className="flex items-center justify-end gap-1 px-4 pt-3">
            <ZoomButton
              label="축소"
              disabled={columns >= 5}
              onClick={() => setColumns((c) => Math.min(5, c + 1))}
              sign="−"
            />
            <ZoomButton
              label="확대"
              disabled={columns <= 2}
              onClick={() => setColumns((c) => Math.max(2, c - 1))}
              sign="+"
            />
          </div>
          <div className="p-4 pt-2">
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

/** 갤러리 줌 버튼. 더 작은 열 수 = 확대(+), 더 많은 열 = 축소(−). */
function ZoomButton({
  label,
  sign,
  disabled,
  onClick,
}: {
  label: string
  sign: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-500 disabled:opacity-30"
    >
      {sign}
    </button>
  )
}
