/**
 * @figma-scaffold 공용 우클릭 컨텍스트 메뉴 프리미티브 — 디자인 미정 (#576)
 */
'use client'

import { ContextMenu as RadixContextMenu } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface ContextMenuItem {
  label: string
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

interface ContextMenuProps {
  /** 우클릭 대상. asChild 로 그대로 렌더된다. */
  trigger: ReactNode
  items: ContextMenuItem[]
}

/**
 * trigger 우클릭으로 여는 액션 메뉴 (radix ContextMenu 기반).
 * 패널/아이템 스타일은 Select 드롭다운, item API 는 ActionDrawer 와 정합.
 */
export function ContextMenu({ trigger, items }: ContextMenuProps) {
  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger asChild>{trigger}</RadixContextMenu.Trigger>
      <RadixContextMenu.Portal>
        <RadixContextMenu.Content className="z-50 min-w-[120px] rounded-lg border border-solid border-gray-300 bg-white py-1 shadow-[0_6px_20px_rgba(0,0,0,0.1)] outline-none">
          {items.map((item) => (
            <RadixContextMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                'flex w-full cursor-pointer items-center px-3 py-2 text-r-14 outline-none hover:bg-secondary data-[highlighted]:bg-secondary data-[disabled]:cursor-not-allowed data-[disabled]:text-gray-400',
                item.destructive ? 'text-[#FF4242]' : 'text-gray-900'
              )}
            >
              {item.label}
            </RadixContextMenu.Item>
          ))}
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  )
}
