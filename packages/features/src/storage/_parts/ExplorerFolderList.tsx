import type { ReactNode } from 'react'
import Link from 'next/link'
import { Folder as FolderIcon } from 'lucide-react'
import { formatDate } from '@bconnect/config/format'
import { FolderRowEditor } from './FolderRowEditor'
import type { Folder } from '../types'

export interface ExplorerFolderListProps {
  folders: Folder[]
  folderHref: (folderId: string) => string
  /** 행 케밥 — 앱이 메뉴 프리미티브로 렌더(없으면 케밥 없음). */
  renderKebab?: (folder: Folder) => ReactNode
  /** 인라인 이름수정 중인 폴더 id. */
  editingId?: string | null
  onRenameSubmit?: (id: string, title: string) => void
  onRenameCancel?: () => void
  emptyLabel?: string
}

/** 폴더 목록 행 (아이콘 + 이름 + 날짜 + 케밥). 이름수정 시 행이 인라인 입력으로 치환. */
export function ExplorerFolderList({
  folders,
  folderHref,
  renderKebab,
  editingId,
  onRenameSubmit,
  onRenameCancel,
  emptyLabel = '폴더가 없습니다',
}: ExplorerFolderListProps) {
  if (folders.length === 0) {
    return <p className="px-1 py-8 text-center text-sm text-gray-500">{emptyLabel}</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {folders.map((folder) =>
        editingId === folder.id ? (
          <li key={folder.id}>
            <FolderRowEditor
              initialTitle={folder.title}
              onSubmit={(title) => onRenameSubmit?.(folder.id, title)}
              onCancel={() => onRenameCancel?.()}
            />
          </li>
        ) : (
          <li key={folder.id} className="flex items-center gap-1 rounded-lg bg-gray-50 pr-2">
            <Link
              href={folderHref(folder.id)}
              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5"
            >
              <FolderIcon size={20} className="shrink-0 text-gray-500" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-base text-gray-900">
                {folder.title}
              </span>
              <span className="shrink-0 text-xs text-gray-400">{formatDate(folder.createdAt)}</span>
            </Link>
            {renderKebab?.(folder)}
          </li>
        )
      )}
    </ul>
  )
}
