/**
 * @figma-pending 확인 다이얼로그 — 시안 미정
 */
'use client'

import { AlertDialog } from 'radix-ui'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 다이얼로그 제목 (예: "게시물을 삭제할까요?") */
  title: string
  /** 부가 설명 (예: "삭제한 게시물은 복구할 수 없어요.") */
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** confirm 버튼을 destructive(빨강)로 — 삭제 등 */
  destructive?: boolean
  onConfirm: () => void
}

/**
 * 확인/취소 다이얼로그 (radix AlertDialog 기반, presentational).
 * open 상태와 onConfirm 은 호출부(앱)가 소유한다.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => onOpenChange(false)}
        />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 focus:outline-none">
          <AlertDialog.Title className="text-sb-16 text-gray-900">{title}</AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="mt-2 text-r-14 text-gray-600">
              {description}
            </AlertDialog.Description>
          )}
          <div className="mt-5 flex justify-end gap-1">
            <AlertDialog.Cancel asChild>
              <Button variant="text" size="small">
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant="text"
                size="small"
                onClick={onConfirm}
                className={
                  destructive
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-primary hover:bg-primary/10'
                }
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
