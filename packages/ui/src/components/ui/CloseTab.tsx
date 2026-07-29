/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=3437-14488
 */
'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronsRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface CloseTabProps {
  'aria-label': string
  href?: string
  onClick?: () => void
  className?: string
}

// neutral-300(#D4D4D4)·neutral-500(#737373) 은 Figma close_tab 의 stroke·아이콘 색과 정확히 일치한다.
const CLOSE_TAB_CLASSES =
  'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-500 outline-none transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95'

/**
 * 탭(패널) 닫기 버튼. 패널을 우측으로 collapse 하는 원형 어포던스로, 패널 가장자리에 걸쳐 띄워 쓴다.
 * 위치는 소비처가 `className` 으로 주입한다.
 *
 * href 면 prefetch `<Link>`(navigation 룰 — 핸들러 router.push 금지), 아니면 `<button onClick>`
 * (닫기 가드가 필요한 패널용).
 */
export function CloseTab({ href, onClick, className, ...props }: CloseTabProps) {
  const icon = <ChevronsRight size={24} strokeWidth={1.5} aria-hidden />

  if (href) {
    return (
      <Link href={href} scroll={false} className={cn(CLOSE_TAB_CLASSES, className)} {...props}>
        {icon}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cn(CLOSE_TAB_CLASSES, className)} {...props}>
      {icon}
    </button>
  )
}
