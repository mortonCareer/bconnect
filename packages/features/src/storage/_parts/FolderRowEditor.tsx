'use client'

import { useEffect, useRef, useState } from 'react'
import { Folder as FolderIcon } from 'lucide-react'

export interface FolderRowEditorProps {
  initialTitle?: string
  onSubmit: (title: string) => void
  onCancel: () => void
  placeholder?: string
}

/**
 * 폴더 행 스타일 그대로의 인라인 입력(생성/이름수정 공용) — 폴더 아이콘·배경·높이 동일.
 * Enter/blur 저장, Esc 취소 (별도 저장 버튼 없음).
 */
export function FolderRowEditor({
  initialTitle = '',
  onSubmit,
  onCancel,
  placeholder = '폴더 이름',
}: FolderRowEditorProps) {
  const [value, setValue] = useState(initialTitle)
  const ref = useRef<HTMLInputElement>(null)
  // 드로어 닫힘 등으로 autoFocus 가 빗나갈 수 있어 마운트 시 강제 포커스 + 기존 이름 전체 선택.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    el.select()
  }, [])
  const commit = () => {
    const t = value.trim()
    if (t) onSubmit(t)
    else onCancel()
  }
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3.5">
      <FolderIcon size={20} className="shrink-0 text-gray-500" aria-hidden />
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={commit}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
      />
    </div>
  )
}
