'use client'

import { useState } from 'react'
import { Button, ConfirmDialog, Input, MenuButton } from '@bconnect/ui'
import { DocsExplorerView } from '@bconnect/features'
import type { Folder } from '@bconnect/features'
import { DocsHeader } from './DocsHeader'
import { useFolders, useStorageMutations } from '@/lib/storage-mock/hooks'

/** plan 동산보드 루트 — 폴더 목록(좌) + 빈 상태 안내(우). 폴더 미선택 시. */
export function DocsRoot({ projectId }: { projectId: string }) {
  const { data: folders, isLoading, isError } = useFolders(projectId)
  const { createFolder, deleteFolder } = useStorageMutations()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Folder | null>(null)

  const submitCreate = () => {
    if (name.trim()) createFolder({ projectId, title: name.trim() })
    setName('')
    setCreating(false)
  }

  return (
    <div className="flex h-full flex-col">
      <DocsHeader projectId={projectId} />
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto border-r border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-900">폴더</h2>
            {creating ? (
              <div className="flex items-center gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitCreate()}
                  placeholder="폴더 이름"
                  size="small"
                  className="w-40"
                  autoFocus
                />
                <Button size="small" onClick={submitCreate}>
                  확인
                </Button>
                <Button variant="text" size="small" onClick={() => setCreating(false)}>
                  취소
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="small" onClick={() => setCreating(true)}>
                + 폴더 추가
              </Button>
            )}
          </div>
          <DocsExplorerView
            folders={folders ?? []}
            isLoading={isLoading}
            isError={isError}
            folderHref={(id) => `/projects/${projectId}/docs/${id}`}
            renderKebab={(folder) => (
              <MenuButton
                ariaLabel="폴더 메뉴"
                items={[
                  { label: '삭제', destructive: true, onSelect: () => setPendingDelete(folder) },
                ]}
              />
            )}
          />
        </div>
        <aside className="flex w-[360px] shrink-0 items-center justify-center p-6">
          <p className="text-center text-sm text-gray-400">폴더를 선택하세요</p>
        </aside>
      </div>

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
    </div>
  )
}
