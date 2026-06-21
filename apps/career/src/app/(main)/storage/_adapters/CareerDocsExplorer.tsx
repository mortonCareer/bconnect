'use client'

import { useMemo, useState } from 'react'
import {
  ActionDrawer,
  Button,
  ConfirmDialog,
  Fab,
  Input,
  MoreVerticalIcon,
  SearchIcon,
  TopBar,
} from '@bconnect/ui'
import { DocsExplorerView } from '@bconnect/features'
import type { Folder } from '@bconnect/features'
import { useAllFolders, useStorageMutations } from '@/lib/storage-mock/hooks'

/** career 동산보드 탐색기 루트 — 검색 + 폴더 목록(배정 프로젝트 전체 평면) + FAB(폴더 추가). */
export function CareerDocsExplorer() {
  const { data: folders, isLoading, isError } = useAllFolders()
  const { createFolder, deleteFolder } = useStorageMutations()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [kebabFor, setKebabFor] = useState<Folder | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Folder | null>(null)

  const filtered = useMemo(
    () => (folders ?? []).filter((f) => f.title.toLowerCase().includes(query.trim().toLowerCase())),
    [folders, query]
  )

  const submitCreate = () => {
    // mock: 신규 폴더는 기본 프로젝트('1')에 귀속. TODO(BE): 기술자 배정 프로젝트 선택 UI.
    if (name.trim()) createFolder({ projectId: '1', title: name.trim() })
    setName('')
    setCreating(false)
  }

  return (
    <>
      <TopBar variant="default" title="동산보드" showAction={false} />
      <div className="flex flex-col gap-3 p-4">
        <DocsExplorerView
          folders={filtered}
          isLoading={isLoading}
          isError={isError}
          folderHref={(id) => `/storage/${id}`}
          emptyLabel={query ? '검색 결과가 없어요' : '폴더가 없습니다'}
          searchSlot={
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2.5">
              <SearchIcon size={18} className="shrink-0 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="폴더 또는 이미지명 검색"
                aria-label="폴더 또는 이미지명 검색"
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          }
          renderKebab={(folder) => (
            <button
              type="button"
              aria-label="폴더 메뉴"
              onClick={() => setKebabFor(folder)}
              className="flex h-7 w-7 shrink-0 items-center justify-center text-gray-400"
            >
              <MoreVerticalIcon size={18} />
            </button>
          )}
        />
        {creating && (
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitCreate()}
              placeholder="폴더 이름"
              size="small"
              autoFocus
            />
            <Button size="small" onClick={submitCreate}>
              확인
            </Button>
            <Button variant="text" size="small" onClick={() => setCreating(false)}>
              취소
            </Button>
          </div>
        )}
      </div>

      <Fab aria-label="폴더 추가" onClick={() => setCreating(true)} />

      <ActionDrawer
        open={kebabFor != null}
        onOpenChange={(open) => {
          if (!open) setKebabFor(null)
        }}
        items={[
          {
            label: '삭제',
            destructive: true,
            onSelect: () => {
              if (kebabFor) setPendingDelete(kebabFor)
            },
          },
        ]}
      />
      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="폴더를 삭제할까요?"
        description="폴더 안의 이미지와 메모가 모두 삭제돼요."
        destructive
        confirmLabel="삭제"
        onConfirm={() => {
          if (pendingDelete) deleteFolder(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </>
  )
}
