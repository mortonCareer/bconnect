'use client'

import { useState } from 'react'
import {
  ActionDrawer,
  ConfirmDialog,
  EditIcon,
  Fab,
  MoreVerticalIcon,
  PlusIcon,
  TrashIcon,
} from '@bconnect/ui'
import { MemoListView } from '@bconnect/features'
import type { Memo } from '@bconnect/features'
import { useFolderMemos, useMemoMutations } from '@/lib/storage/hooks'

/** career 폴더 메모 탭 — 메모 CRUD (작성=FAB, 케밥=ActionDrawer, 삭제=ConfirmDialog 가드). */
export function CareerMemoTab({ folderId }: { folderId: string }) {
  const { data: memos, isLoading, isError } = useFolderMemos(folderId)
  const { createMemo, updateMemo, deleteMemo } = useMemoMutations(folderId)
  const [composing, setComposing] = useState(false)
  const [kebab, setKebab] = useState<{ memo: Memo; edit: () => void; remove: () => void } | null>(
    null
  )
  const [pendingDelete, setPendingDelete] = useState<{ run: () => void } | null>(null)

  return (
    <>
      <MemoListView
        memos={memos ?? []}
        isLoading={isLoading}
        isError={isError}
        canManage
        composing={composing}
        onComposingChange={setComposing}
        onCreate={(content) => createMemo(content)}
        onUpdate={(id, content) => updateMemo(id, content)}
        onDelete={(id) => deleteMemo(id)}
        confirmDelete={(onConfirm) => setPendingDelete({ run: onConfirm })}
        renderKebab={(memo, actions) => (
          <button
            type="button"
            aria-label="메모 메뉴"
            onClick={() => setKebab({ memo, edit: actions.edit, remove: actions.remove })}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreVerticalIcon size={18} />
          </button>
        )}
      />

      {!composing && (
        <Fab
          aria-label="메모 작성"
          onClick={() => setComposing(true)}
          icon={<PlusIcon size={22} />}
        />
      )}

      <ActionDrawer
        open={kebab != null}
        onOpenChange={(open) => {
          if (!open) setKebab(null)
        }}
        items={
          kebab
            ? [
                { label: '수정', icon: <EditIcon size={18} />, onSelect: kebab.edit },
                {
                  label: '삭제',
                  icon: <TrashIcon size={18} />,
                  destructive: true,
                  onSelect: kebab.remove,
                },
              ]
            : []
        }
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
    </>
  )
}
