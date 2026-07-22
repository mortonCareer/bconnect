/**
 * @figma-scaffold 공용 액션 드로어 프리미티브 — 디자인 미정, Drawer 위 메뉴 슬롯 (#544)
 */
'use client'

import type { ReactNode } from 'react'
import { Drawer, DrawerContent, DrawerTitle } from './shadcn/drawer'
import { cn } from '../../lib/utils'

export interface ActionDrawerItem {
  label: string
  /** 좌측 아이콘 (필수) — 모든 액션은 아이콘을 가진다. currentColor 면 destructive 색(빨강) 자동 전파. */
  icon: ReactNode
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

interface ActionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 시각 타이틀. 생략 시 a11y 용으로만 존재(visually hidden). */
  title?: string
  items: ActionDrawerItem[]
}

/**
 * 하단에서 올라오는 액션 메뉴 드로어. shadcn Drawer(vaul) 위에 메뉴 슬롯만 얹는다.
 * 드래그/스와이프 닫기·ESC·포커스 트랩·스크롤 잠금은 Drawer 가 처리.
 */
export function ActionDrawer({ open, onOpenChange, title, items }: ActionDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined}>
        <DrawerTitle className={cn('px-4 py-3 text-m-16 text-gray-900', !title && 'sr-only')}>
          {title ?? '작업 선택'}
        </DrawerTitle>
        <div className="flex flex-col pb-[env(safe-area-inset-bottom)]">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                onOpenChange(false)
                item.onSelect()
              }}
              className={cn(
                'flex cursor-pointer items-center gap-3 px-4 py-4 text-left text-m-16 transition-colors hover:bg-gray-50',
                'disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent',
                item.destructive ? 'text-destructive' : 'text-gray-900'
              )}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
