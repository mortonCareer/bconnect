'use client'

import { ChevronLeft, ChevronsRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

/** 이 값을 넘는 카운트는 `99+` 로 표기 (뱃지 폭 고정) */
const MAX_TITLE_COUNT = 99

export interface PanelHeaderProps {
  title?: string
  /** 제목 옆 안 읽음 카운트 뱃지 (0·undefined 면 렌더 안 함) */
  titleCount?: number
  closeHref: string
  closeLabel?: string
  backHref?: string
  backLabel?: string
  rightSlot?: ReactNode
  /** 닫기를 Link 대신 onClose 버튼으로 — 닫기 가드(미완성 작업 등)가 필요한 패널용. */
  closeAsButton?: boolean
  onClose?: () => void
}

/**
 * 패널 공통 헤더. 좌측 affordance 는 `backHref` 유무로 갈림 —
 * 있으면 뒤로(ChevronLeft)+우측 닫기, 없으면 좌측 닫기(ChevronsRight, 패널을 우측으로 collapse).
 * 닫기는 항상 `closeHref` 로의 navigation — 경로는 유지하고 `?panel=` 만 제거한다(필터 등 다른 search param 은 보존).
 */
export function PanelHeader({
  title,
  titleCount,
  closeHref,
  closeLabel = '패널 닫기',
  backHref,
  backLabel = '뒤로',
  rightSlot,
  closeAsButton,
  onClose,
}: PanelHeaderProps) {
  const closeIconClass =
    'flex h-5 w-5 cursor-pointer items-center justify-center text-[#999] hover:text-gray-900'
  const closeLink =
    closeAsButton && onClose ? (
      <button type="button" onClick={onClose} aria-label={closeLabel} className={closeIconClass}>
        <ChevronsRight className="h-5 w-5" />
      </button>
    ) : (
      <Link href={closeHref} scroll={false} aria-label={closeLabel} className={closeIconClass}>
        <ChevronsRight className="h-5 w-5" />
      </Link>
    )

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
        closeLink
      )}
      {/* 제목은 좌·우 슬롯 폭과 무관하게 패널 정중앙 (TopBar 와 동일한 절대 중앙 정렬, #970) */}
      <div className="pointer-events-none absolute left-1/2 flex max-w-[60%] -translate-x-1/2 items-center gap-2">
        <h2 className="truncate text-sb-16 text-gray-900">{title}</h2>
        {titleCount != null && titleCount > 0 && (
          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-none text-white">
            {titleCount > MAX_TITLE_COUNT ? `${MAX_TITLE_COUNT}+` : titleCount}
          </span>
        )}
      </div>
      <div className="flex-1" aria-hidden />
      {backHref ? closeLink : (rightSlot ?? <span className="h-5 w-5" aria-hidden />)}
    </div>
  )
}
