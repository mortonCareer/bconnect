'use client'

import { useState, type ReactNode } from 'react'
import { ConfirmDialog, useUnsavedGuard } from '@bconnect/ui'
import { MemoCard } from './_parts/MemoCard'
import { MemoEditor } from './_parts/MemoEditor'
import type { Memo } from './types'

const NEW_ID = '__new__'

export interface MemoListViewProps {
  memos: Memo[]
  isLoading: boolean
  isError: boolean
  /** false/생략 시 읽기전용(케밥·작성 없음). */
  canManage?: boolean
  onCreate?: (content: string) => void
  onUpdate?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  /** 삭제 가드 — 앱이 ConfirmDialog 로 감싼 콜백 주입(없으면 즉시 삭제). */
  confirmDelete?: (onConfirm: () => void) => void
  /** 카드 케밥 — 앱이 메뉴 프리미티브로 렌더, actions 로 수정/삭제 연결. */
  renderKebab?: (memo: Memo, actions: { edit: () => void; remove: () => void }) => ReactNode
  emptyLabel?: string
}

/**
 * 폴더 메모 목록 + 인라인 편집/작성 호스트.
 * 편집은 카드 → MemoEditor 모프, 미저장 이탈은 useUnsavedGuard 로 확인. 삭제는 앱의 confirmDelete 가드.
 */
export function MemoListView({
  memos,
  isLoading,
  isError,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
  confirmDelete,
  renderKebab,
  emptyLabel = '메모가 없습니다',
}: MemoListViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const guard = useUnsavedGuard(dirty)

  const closeEditor = () => {
    setEditingId(null)
    setDirty(false)
  }
  const requestCancel = () => guard.requestClose(closeEditor)
  const startCreate = () => {
    setEditingId(NEW_ID)
    setDirty(false)
  }
  const startEdit = (id: string) => {
    setEditingId(id)
    setDirty(false)
  }
  const requestDelete = (id: string) => {
    const run = () => onDelete?.(id)
    if (confirmDelete) confirmDelete(run)
    else run()
  }

  if (isLoading) {
    return <p className="px-1 py-8 text-center text-sm text-gray-500">불러오는 중…</p>
  }
  if (isError) {
    return <p className="px-1 py-8 text-center text-sm text-gray-500">메모를 불러올 수 없습니다</p>
  }

  const showCreateButton = canManage && onCreate && editingId !== NEW_ID
  const isEmpty = memos.length === 0 && editingId !== NEW_ID

  return (
    <div className="flex flex-col gap-3">
      {showCreateButton && (
        <button
          type="button"
          onClick={startCreate}
          className="self-end rounded-md px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10"
        >
          + 메모 작성
        </button>
      )}

      {editingId === NEW_ID && onCreate && (
        <MemoEditor
          onSubmit={(content) => {
            onCreate(content)
            closeEditor()
          }}
          onRequestCancel={requestCancel}
          onDirtyChange={setDirty}
          submitLabel="작성"
        />
      )}

      {isEmpty ? (
        <p className="px-1 py-8 text-center text-sm text-gray-500">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {memos.map((memo) =>
            editingId === memo.id ? (
              <li key={memo.id}>
                <MemoEditor
                  initialContent={memo.content}
                  onSubmit={(content) => {
                    onUpdate?.(memo.id, content)
                    closeEditor()
                  }}
                  onRequestCancel={requestCancel}
                  onDirtyChange={setDirty}
                />
              </li>
            ) : (
              <li key={memo.id}>
                <MemoCard
                  memo={memo}
                  renderKebab={
                    canManage
                      ? (m) =>
                          renderKebab?.(m, {
                            edit: () => startEdit(m.id),
                            remove: () => requestDelete(m.id),
                          })
                      : undefined
                  }
                />
              </li>
            )
          )}
        </ul>
      )}

      <ConfirmDialog
        open={guard.confirmOpen}
        onOpenChange={guard.setConfirmOpen}
        title="편집을 취소할까요?"
        description="저장하지 않은 변경 내용이 사라져요."
        confirmLabel="나가기"
        destructive
        onConfirm={guard.confirmProceed}
      />
    </div>
  )
}
