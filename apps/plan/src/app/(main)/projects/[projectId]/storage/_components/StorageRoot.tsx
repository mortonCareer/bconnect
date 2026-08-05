'use client'

import { useState } from 'react'
import {
  Button,
  ConfirmDialog,
  EditIcon,
  MenuButton,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  TrashIcon,
  useDocumentTitle,
} from '@bconnect/ui'
import { StorageExplorerView } from '@bconnect/features'
import type { Folder } from '@bconnect/features'
import { useGetProject } from '@bconnect/api-client'
import { StorageHeader } from './StorageHeader'
import { useFolderMutations, useFolders } from '@/lib/storage/hooks'

/** plan 동산보드 루트 — 폴더 목록(좌) + 빈 상태 안내(우), 컬럼 비율 드래그 리사이즈. 폴더 미선택 시. */
export function StorageRoot({ projectId }: { projectId: string }) {
  const { data: folders, isLoading, isError } = useFolders(projectId)
  const { createFolder, updateFolder, deleteFolder } = useFolderMutations(projectId)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Folder | null>(null)
  const { data: project } = useGetProject(Number(projectId))

  // 탭 title 에 프로젝트명 반영 (리뷰 반영, #785). 로딩 전엔 static fallback('저장소') 유지.
  useDocumentTitle(project ? `${project.title} - 저장소` : undefined)

  return (
    <div className="flex h-full flex-col">
      <StorageHeader projectId={projectId} />
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={68} minSize={40}>
          <div className="h-full overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900">폴더</h2>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setCreating(true)}
                disabled={creating}
              >
                + 폴더 추가
              </Button>
            </div>
            <StorageExplorerView
              folders={folders ?? []}
              isLoading={isLoading}
              isError={isError}
              folderHref={(id) => `/projects/${projectId}/storage/${id}`}
              creating={creating}
              onCreateSubmit={(title) => {
                createFolder(title)
                setCreating(false)
              }}
              onCreateCancel={() => setCreating(false)}
              editingId={editingId}
              onRenameSubmit={(id, title) => {
                updateFolder(id, title)
                setEditingId(null)
              }}
              onRenameCancel={() => setEditingId(null)}
              renderKebab={(folder) => (
                <MenuButton
                  ariaLabel="폴더 메뉴"
                  items={[
                    {
                      label: '이름 수정',
                      icon: <EditIcon size={16} />,
                      onSelect: () => setEditingId(folder.id),
                    },
                    {
                      label: '삭제',
                      icon: <TrashIcon size={16} />,
                      destructive: true,
                      onSelect: () => setPendingDelete(folder),
                    },
                  ]}
                />
              )}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={32} minSize={20}>
          <aside className="flex h-full items-center justify-center p-6">
            <p className="text-center text-sm text-gray-400">폴더를 선택하세요</p>
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>

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
