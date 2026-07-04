/**
 * @figma-scaffold 동산보드 플로팅 액션 버튼 — 디자인 미정, 폴더 생성/이미지 업로드 진입 (SPRINT4 공유 저장소 pre-build)
 */
'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface FabProps {
  'aria-label': string
  href?: string
  onClick?: () => void
  /** 기본 아이콘은 Plus. 다른 액션(이미지 추가 등)이면 주입. */
  icon?: React.ReactNode
  className?: string
}

const FAB_CLASSES =
  'fixed bottom-[90px] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] outline-none transition-colors hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95'

/**
 * 플로팅 액션 버튼. href 면 prefetch `<Link>`(navigation 룰 — 핸들러 router.push 금지),
 * 아니면 `<button onClick>`. 하단 네비(70px)를 피해 bottom-[90px] 고정.
 */
export function Fab({ href, onClick, icon, className, ...props }: FabProps) {
  const content = icon ?? <Plus size={24} aria-hidden />
  if (href) {
    return (
      <Link href={href} className={cn(FAB_CLASSES, className)} {...props}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cn(FAB_CLASSES, className)} {...props}>
      {content}
    </button>
  )
}
