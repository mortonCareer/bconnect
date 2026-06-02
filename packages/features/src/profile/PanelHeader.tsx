'use client'

import Link from 'next/link'
import { ChevronsRight } from 'lucide-react'

interface PanelHeaderProps {
  username?: string
  closeHref: string
}

export function PanelHeader({ username, closeHref }: PanelHeaderProps) {
  return (
    <div className="flex h-12 shrink-0 items-center border-b border-gray-200 px-4">
      <Link
        href={closeHref}
        scroll={false}
        aria-label="프로필 패널 닫기"
        className="flex h-5 w-5 cursor-pointer items-center justify-center text-gray-700 hover:text-gray-900"
      >
        <ChevronsRight className="h-5 w-5" />
      </Link>
      <h2 className="flex-1 truncate text-center text-sb-16 text-gray-900">{username}</h2>
      <span className="h-5 w-5 shrink-0" aria-hidden />
    </div>
  )
}
