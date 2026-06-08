/**
 * @figma-scaffold 공용 액션 드로어 프리미티브 — 디자인 미정, Drawer 위 메뉴 슬롯 (#544)
 */
'use client'

import { Drawer, DrawerContent, DrawerTitle } from './shadcn/drawer'
import { cn } from '../../lib/utils'

export interface ActionDrawerItem {
  label: string
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
                'px-4 py-4 text-left text-m-16 disabled:opacity-40',
                item.destructive ? 'text-destructive' : 'text-gray-900'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
