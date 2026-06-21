'use client'

import { FolderImagesView } from '@bconnect/features'
import { DocsHeader } from './DocsHeader'
import { DocsMemoPanel } from './DocsMemoPanel'
import { DocsFileDetail } from './DocsFileDetail'
import { useFolderImages } from '@/lib/storage-mock/hooks'
import { useDocsParams } from '../_hooks/useDocsParams'

/** plan 동산보드 폴더 — 갤러리(좌) + 메모|파일상세(우, ?file= 유무). */
export function DocsFolder({ projectId, folderId }: { projectId: string; folderId: string }) {
  const [{ file }] = useDocsParams()
  const { data: images, isLoading, isError } = useFolderImages(folderId)
  const basePath = `/projects/${projectId}/docs/${folderId}`

  return (
    <div className="flex h-full flex-col">
      <DocsHeader projectId={projectId} folderId={folderId} />
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto border-r border-gray-200 p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">이미지</h2>
          <FolderImagesView
            images={images ?? []}
            isLoading={isLoading}
            isError={isError}
            selectedId={file ?? undefined}
            imageHref={(id) => `${basePath}?file=${id}`}
          />
        </div>
        <aside className="w-[360px] shrink-0 overflow-y-auto">
          {file ? (
            <DocsFileDetail
              key={file}
              projectId={projectId}
              folderId={folderId}
              fileId={file}
              closeHref={basePath}
            />
          ) : (
            <DocsMemoPanel folderId={folderId} />
          )}
        </aside>
      </div>
    </div>
  )
}
