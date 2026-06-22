import type { ReactNode } from 'react'
import { ExplorerFolderList } from './_parts/ExplorerFolderList'
import { FolderRowEditor } from './_parts/FolderRowEditor'
import type { Folder } from './types'

export interface DocsExplorerViewProps {
  folders: Folder[]
  isLoading: boolean
  isError: boolean
  folderHref: (folderId: string) => string
  /** career: 검색 입력 주입. plan: 생략. */
  searchSlot?: ReactNode
  renderKebab?: (folder: Folder) => ReactNode
  /** 폴더 생성 인라인 행(폴더 행 스타일) 표시 — 앱의 FAB 가 제어. */
  creating?: boolean
  onCreateSubmit?: (title: string) => void
  onCreateCancel?: () => void
  /** 인라인 이름수정. */
  editingId?: string | null
  onRenameSubmit?: (id: string, title: string) => void
  onRenameCancel?: () => void
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
  creating,
  onCreateSubmit,
  onCreateCancel,
  editingId,
  onRenameSubmit,
  onRenameCancel,
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
        <div className="flex flex-col gap-2">
          {creating && onCreateSubmit && (
            <FolderRowEditor
              onSubmit={onCreateSubmit}
              onCancel={() => onCreateCancel?.()}
              placeholder="새 폴더 이름"
            />
          )}
          <ExplorerFolderList
            folders={folders}
            folderHref={folderHref}
            renderKebab={renderKebab}
            editingId={editingId}
            onRenameSubmit={onRenameSubmit}
            onRenameCancel={onRenameCancel}
            emptyLabel={emptyLabel}
          />
        </div>
      )}
    </div>
  )
}
