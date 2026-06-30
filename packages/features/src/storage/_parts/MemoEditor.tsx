'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@bconnect/ui'

export interface MemoEditorProps {
  initialContent?: string
  onSubmit: (content: string) => void
  /** ESC/취소 — 부모(useUnsavedGuard)가 dirty 면 확인 다이얼로그로 가드. */
  onRequestCancel: () => void
  onDirtyChange?: (dirty: boolean) => void
  submitLabel?: string
}

/** 메모 인라인 편집기 (카드 → 편집기 모프). ESC=취소(가드), 제출 버튼은 입력 아래. */
export function MemoEditor({
  initialContent = '',
  onSubmit,
  onRequestCancel,
  onDirtyChange,
  submitLabel = '제출',
}: MemoEditorProps) {
  const [draft, setDraft] = useState(initialContent)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const setValue = (v: string) => {
    setDraft(v)
    onDirtyChange?.(v !== initialContent)
  }

  return (
    <div
      className="rounded-lg border border-primary p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onRequestCancel()
        }
      }}
    >
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        placeholder="메모를 입력해주세요"
        className="w-full resize-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="text" size="small" onClick={onRequestCancel}>
          취소
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={() => onSubmit(draft)}
          disabled={draft.trim() === ''}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
