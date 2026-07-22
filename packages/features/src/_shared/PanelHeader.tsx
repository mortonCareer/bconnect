'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

/** 이 값을 넘는 카운트는 `99+` 로 표기 (뱃지 폭 고정) */
const MAX_TITLE_COUNT = 99

export interface PanelHeaderProps {
  title?: string
  /** 제목 옆 안 읽음 카운트 뱃지 (0·undefined 면 렌더 안 함) */
  titleCount?: number
  backHref?: string
  backLabel?: string
  rightSlot?: ReactNode
}

/**
 * 패널 공통 헤더. 좌측은 `backHref` 가 있을 때만 뒤로(ChevronLeft), 우측은 `rightSlot`.
 * 제목은 좌·우 슬롯 폭과 무관하게 패널 정중앙 (TopBar 와 동일한 절대 중앙 정렬, #970).
 * 닫기는 헤더가 아니라 `PanelShell` 이 패널 가장자리에 띄우는 `CloseTab` 이 담당한다 (#969).
 */
export function PanelHeader({
  title,
  titleCount,
  backHref,
  backLabel = '뒤로',
  rightSlot,
}: PanelHeaderProps) {
  return (
    <div className="relative flex h-12 shrink-0 items-center px-4">
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
      <div className="pointer-events-none absolute left-1/2 flex max-w-[60%] -translate-x-1/2 items-center gap-2">
        <h2 className="truncate text-sb-16 text-gray-900">{title}</h2>
        {titleCount != null && titleCount > 0 && (
          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-none text-white">
            {titleCount > MAX_TITLE_COUNT ? `${MAX_TITLE_COUNT}+` : titleCount}
          </span>
        )}
      </div>
      <div className="flex-1" aria-hidden />
      {rightSlot ?? <span className="h-5 w-5" aria-hidden />}
    </div>
  )
}
