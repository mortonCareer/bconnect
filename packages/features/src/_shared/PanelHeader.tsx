'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export interface PanelHeaderProps {
  title?: string
  backHref?: string
  backLabel?: string
  rightSlot?: ReactNode
}

/**
 * 패널 공통 헤더. 좌측은 `backHref` 가 있을 때만 뒤로(ChevronLeft), 우측은 `rightSlot`.
 * 좌우 폭이 같은 스페이서로 제목을 중앙에 유지한다.
 * 닫기는 헤더가 아니라 `PanelShell` 이 패널 가장자리에 띄우는 `CloseTab` 이 담당한다 (#969).
 */
export function PanelHeader({ title, backHref, backLabel = '뒤로', rightSlot }: PanelHeaderProps) {
  return (
    <div className="flex h-12 shrink-0 items-center px-4">
      {backHref ? (
        <Link
          href={backHref}
          scroll={false}
          aria-label={backLabel}
          className="flex h-5 w-5 cursor-pointer items-center justify-center text-[#999] hover:text-gray-900"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : (
        <span className="h-5 w-5" aria-hidden />
      )}
      <h2 className="flex-1 truncate text-center text-sb-16 text-gray-900">{title}</h2>
      {rightSlot ?? <span className="h-5 w-5" aria-hidden />}
    </div>
  )
}
