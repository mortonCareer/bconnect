'use client'

import { ChevronsRight } from 'lucide-react'

interface PanelHeaderProps {
  username?: string
  onClose: () => void
}

export function PanelHeader({ username, onClose }: PanelHeaderProps) {
  return (
    <div className="flex h-12 shrink-0 items-center border-b border-gray-200 px-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="프로필 패널 닫기"
        className="flex h-5 w-5 items-center justify-center text-gray-700 hover:text-gray-900"
      >
        <ChevronsRight className="h-5 w-5" />
      </button>
      <h2 className="flex-1 truncate text-center text-sb-16 text-gray-900">{username}</h2>
      <span className="h-5 w-5 shrink-0" aria-hidden />
    </div>
  )
}
