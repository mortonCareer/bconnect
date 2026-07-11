'use client'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@bconnect/ui'
import { FolderImagesView } from '@bconnect/features'
import { StorageHeader } from './StorageHeader'
import { StorageMemoPanel } from './StorageMemoPanel'
import { StorageFileDetail } from './StorageFileDetail'
import { useFolderImages } from '@/lib/storage/hooks'
import { useStorageParams } from '../_hooks/useStorageParams'

/** plan 동산보드 폴더 — 갤러리(좌) + 메모|파일상세(우, ?file= 유무), 컬럼 비율 드래그 리사이즈. */
export function StorageFolder({ projectId, folderId }: { projectId: string; folderId: string }) {
  const [{ file }] = useStorageParams()
  const { data: images, isLoading, isError } = useFolderImages(folderId)
  const basePath = `/projects/${projectId}/storage/${folderId}`

  return (
    <div className="flex h-full flex-col">
      <StorageHeader projectId={projectId} folderId={folderId} />
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={68} minSize={40}>
          <div className="h-full overflow-y-auto p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">이미지</h2>
            <FolderImagesView
              images={images ?? []}
              isLoading={isLoading}
              isError={isError}
              selectedId={file ?? undefined}
              imageHref={(id) => `${basePath}?file=${id}`}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={32} minSize={20}>
          <div className="h-full overflow-y-auto">
            {file ? (
              <StorageFileDetail
                key={file}
                folderId={folderId}
                fileId={file}
                closeHref={basePath}
              />
            ) : (
              <StorageMemoPanel folderId={folderId} />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
