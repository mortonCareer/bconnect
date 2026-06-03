'use client'

import Link from 'next/link'
import { ChevronsRight, ChevronLeft } from 'lucide-react'

export interface PanelHeaderProps {
  title?: string
  closeHref: string
  closeLabel?: string
  backHref?: string
  backLabel?: string
}

/**
 * `@panel` 슬롯 패널 공통 헤더. 좌측 affordance 는 `backHref` 유무로 갈림 —
 * 있으면 뒤로(ChevronLeft)+우측 닫기, 없으면 좌측 닫기(ChevronsRight, 패널을 우측으로 collapse).
 * 닫기는 항상 `closeHref`(= base 경로) 로의 navigation (parallel-route slot reset).
 */
export function PanelHeader({
  title,
  closeHref,
  closeLabel = '패널 닫기',
  backHref,
  backLabel = '뒤로',
}: PanelHeaderProps) {
  const closeLink = (
    <Link
      href={closeHref}
      scroll={false}
      aria-label={closeLabel}
      className="flex h-5 w-5 cursor-pointer items-center justify-center text-gray-700 hover:text-gray-900"
    >
      <ChevronsRight className="h-5 w-5" />
    </Link>
  )

  return (
    <div className="flex h-12 shrink-0 items-center border-b border-gray-200 px-4">
      {backHref ? (
        <Link
          href={backHref}
          scroll={false}
          aria-label={backLabel}
          className="flex h-5 w-5 cursor-pointer items-center justify-center text-gray-700 hover:text-gray-900"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : (
        closeLink
      )}
      <h2 className="flex-1 truncate text-center text-sb-16 text-gray-900">{title}</h2>
      {backHref ? closeLink : <span className="h-5 w-5" aria-hidden />}
    </div>
  )
}
