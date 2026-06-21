/**
 * @figma-scaffold 케밥(⋮) 클릭 드롭다운 메뉴 — 디자인 미정, 데스크톱 행/카드 액션 (SPRINT4 공유 저장소 pre-build)
 */
'use client'

import { DropdownMenu } from 'radix-ui'
import { MoreVertical } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface MenuButtonItem {
  label: string
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

export interface MenuButtonProps {
  items: MenuButtonItem[]
  ariaLabel?: string
  className?: string
}

/**
 * ⋮ 트리거 + 드롭다운 메뉴 (radix DropdownMenu). 데스크톱 클릭 메뉴용.
 * 모바일 바텀시트는 ActionDrawer 를 쓴다 — features 는 renderKebab 슬롯으로 둘 중 무엇이든 주입받는다.
 */
export function MenuButton({ items, ariaLabel = '메뉴', className }: MenuButtonProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 outline-none transition-colors hover:bg-gray-100 focus-visible:ring-1 focus-visible:ring-primary',
            className
          )}
        >
          <MoreVertical size={18} aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-32 rounded-lg border border-gray-300 bg-white py-1 shadow-[0_6px_20px_rgba(0,0,0,0.1)]"
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                'cursor-pointer px-3 py-2 text-m-14 outline-none data-[highlighted]:bg-gray-50 data-[disabled]:cursor-default data-[disabled]:opacity-40',
                item.destructive ? 'text-destructive' : 'text-gray-900'
              )}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
