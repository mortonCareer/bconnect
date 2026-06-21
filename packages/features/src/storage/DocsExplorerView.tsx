import type { ReactNode } from 'react'
import { ExplorerFolderList } from './_parts/ExplorerFolderList'
import type { Folder } from './types'

export interface DocsExplorerViewProps {
  folders: Folder[]
  isLoading: boolean
  isError: boolean
  folderHref: (folderId: string) => string
  /** career: 검색 입력 주입. plan: 생략. */
  searchSlot?: ReactNode
  renderKebab?: (folder: Folder) => ReactNode
  emptyLabel?: string
}

/** 탐색기 루트 — 폴더 목록 뷰(컬럼/셸 무관). career 풀페이지·plan 좌측 컬럼 공용. */
export function DocsExplorerView({
  folders,
  isLoading,
  isError,
  folderHref,
  searchSlot,
  renderKebab,
  emptyLabel,
}: DocsExplorerViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {searchSlot}
      {isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-gray-500">불러오는 중…</p>
      ) : isError ? (
        <p className="px-1 py-8 text-center text-sm text-gray-500">폴더를 불러올 수 없습니다</p>
      ) : (
        <ExplorerFolderList
          folders={folders}
          folderHref={folderHref}
          renderKebab={renderKebab}
          emptyLabel={emptyLabel}
        />
      )}
    </div>
  )
}
