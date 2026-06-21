'use client'

import { useRouter } from 'next/navigation'
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { Fab, ImageIcon, Tab, TopBar } from '@bconnect/ui'
import { FolderImagesView } from '@bconnect/features'
import { useFolder, useFolderImages } from '@/lib/storage-mock/hooks'
import { CareerMemoTab } from './CareerMemoTab'
import { CareerFileDetail } from './CareerFileDetail'

/** career 폴더 화면 — 앱바(← title) + Tab[이미지|메모] + 갤러리/메모 + 업로드 FAB. ?file= 시 파일상세 풀스크린. */
export function CareerFolderView({ folderId }: { folderId: string }) {
  const router = useRouter()
  const { data: folder } = useFolder(folderId)
  const { data: images, isLoading, isError } = useFolderImages(folderId)
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum<'images' | 'memo'>(['images', 'memo']).withDefault('images')
  )
  const [file, setFile] = useQueryState('file', parseAsString)

  const title = folder?.title ?? '폴더'
  // 파일 포커스 중이면 뒤로가기는 ?file 해제(갤러리 복귀), 아니면 폴더 목록으로.
  const onBack = () => {
    if (file) setFile(null)
    else router.back()
  }

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title={title} showAction={false} showBack onBack={onBack} />
      {file ? (
        <CareerFileDetail key={file} folderId={folderId} fileId={file} />
      ) : (
        <>
          <Tab
            items={[
              { key: 'images', label: '이미지' },
              { key: 'memo', label: '메모' },
            ]}
            activeKey={tab}
            onChange={(key) => setTab(key === 'memo' ? 'memo' : 'images')}
          />
          <div className="p-4">
            {tab === 'images' ? (
              <FolderImagesView
                images={images ?? []}
                isLoading={isLoading}
                isError={isError}
                onSelect={(id) => setFile(id)}
              />
            ) : (
              <CareerMemoTab folderId={folderId} />
            )}
          </div>
          {tab === 'images' && (
            <Fab
              aria-label="이미지 업로드"
              href={`/storage/upload/select?folder=${folderId}`}
              icon={<ImageIcon size={24} />}
            />
          )}
        </>
      )}
    </div>
  )
}
