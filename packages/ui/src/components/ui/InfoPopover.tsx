/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1878-12374
 */
'use client'

import * as React from 'react'
import { Popover } from 'radix-ui'
import { HelpCircleIcon } from '../../icons'
import { cn } from '../../lib/utils'

export interface InfoPopoverProps {
  /** 물음표 버튼 aria-label — 무엇에 대한 설명인지 (예: '섭외 상태 설명') */
  label: string
  children: React.ReactNode
  className?: string
}

export function InfoPopover({ label, children, className }: InfoPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={label}
        className={cn(
          'relative flex size-[15px] cursor-pointer items-center justify-center rounded-full text-gray-500 outline-none transition-opacity hover:opacity-60 focus-visible:ring-1 focus-visible:ring-primary active:opacity-60',
          "before:absolute before:-inset-3 before:content-['']",
          className
        )}
      >
        <HelpCircleIcon />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={6}
          collisionPadding={16}
          className="z-50 max-w-64 rounded-lg bg-gray-900 px-3 py-2 text-r-12 leading-relaxed text-white shadow-lg"
        >
          {children}
          <Popover.Arrow className="fill-gray-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
