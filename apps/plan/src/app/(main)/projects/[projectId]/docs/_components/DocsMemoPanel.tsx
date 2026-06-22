'use client'

import { useState } from 'react'
import { Button, ConfirmDialog, EditIcon, MenuButton, TrashIcon } from '@bconnect/ui'
import { MemoListView } from '@bconnect/features'
import { useFolderMemos, useStorageMutations } from '@/lib/storage-mock/hooks'

/** plan 우측 컬럼 — 폴더 메모 CRUD (포커스 없을 때). */
export function DocsMemoPanel({ folderId }: { folderId: string }) {
  const { data: memos, isLoading, isError } = useFolderMemos(folderId)
  const { createMemo, updateMemo, deleteMemo } = useStorageMutations()
  const [composing, setComposing] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ run: () => void } | null>(null)

  return (
    <div className="flex flex-col gap-3 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">메모</h2>
        {!composing && (
          <Button variant="primary" onClick={() => setComposing(true)}>
            + 메모 작성
          </Button>
        )}
      </div>
      <MemoListView
        memos={memos ?? []}
        isLoading={isLoading}
        isError={isError}
        canManage
        composing={composing}
        onComposingChange={setComposing}
        onCreate={(content) => createMemo(folderId, content)}
        onUpdate={(id, content) => updateMemo(id, content)}
        onDelete={(id) => deleteMemo(id)}
        confirmDelete={(onConfirm) => setPendingDelete({ run: onConfirm })}
        renderKebab={(_memo, actions) => (
          <MenuButton
            ariaLabel="메모 메뉴"
            items={[
              { label: '수정', icon: <EditIcon size={16} />, onSelect: actions.edit },
              {
                label: '삭제',
                icon: <TrashIcon size={16} />,
                destructive: true,
                onSelect: actions.remove,
              },
            ]}
          />
        )}
      />
      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="메모를 삭제할까요?"
        description="삭제한 메모는 복구할 수 없어요."
        destructive
        confirmLabel="삭제"
        onConfirm={() => {
          pendingDelete?.run()
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
