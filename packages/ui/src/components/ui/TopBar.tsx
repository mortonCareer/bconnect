/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=189-720
 */
'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { ChevronIcon, FilterIcon, ChatIcon } from '../../icons'
import { cn } from '../../lib/utils'

const topBarVariants = cva('sticky top-0 z-40 flex h-15 w-full items-center bg-white px-4', {
  variants: {
    variant: {
      progress: 'justify-between',
      default: 'justify-between',
      home: 'justify-between',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

function ChatBadgeIcon({ count }: { count?: number }) {
  return (
    <div className="relative size-5">
      <ChatIcon className="text-[#9C9C9C]" />
      {count !== undefined && count > 0 && (
        <div className="absolute -right-[7.5px] -top-[3.5px] flex min-w-[15px] items-center justify-center rounded-full bg-destructive px-1">
          <span className="text-[10px] font-bold leading-[15px] text-white">
            {count > 99 ? '99+' : count}
          </span>
        </div>
      )}
    </div>
  )
}

function ProgressBarInline({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex h-[3px] w-[330px] gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn('h-full flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-gray-300')}
        />
      ))}
    </div>
  )
}

export interface TopBarProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof topBarVariants> {
  step?: number
  totalSteps?: number
  title?: string
  actionLabel?: string
  onAction?: () => void
  showAction?: boolean
  chatCount?: number
  onFilter?: () => void
  onChat?: () => void
  onBack?: () => void
  /** backHref가 있으면 Link로 렌더링 (prefetch), 없으면 button + onBack */
  backHref?: string
}

const TopBar = React.forwardRef<HTMLElement, TopBarProps>(
  (
    {
      className,
      variant = 'default',
      step = 1,
      totalSteps = 3,
      title,
      actionLabel = '완료',
      onAction,
      showAction = true,
      chatCount,
      onFilter,
      onChat,
      onBack,
      backHref,
      ...props
    },
    ref
  ) => {
    const backButtonClass =
      'flex size-5 cursor-pointer items-center justify-center transition-all hover:opacity-60 active:scale-[0.95]'

    const BackButton = backHref ? (
      <a href={backHref} className={backButtonClass} aria-label="뒤로가기">
        <ChevronIcon direction="left" className="text-[#9C9C9C]" />
      </a>
    ) : (
      <button type="button" onClick={onBack} className={backButtonClass} aria-label="뒤로가기">
        <ChevronIcon direction="left" className="text-[#9C9C9C]" />
      </button>
    )

    return (
      <header ref={ref} className={cn(topBarVariants({ variant, className }))} {...props}>
        {variant === 'progress' && (
          <>
            {BackButton}
            <ProgressBarInline step={step} total={totalSteps} />
            <div className="size-5" />
          </>
        )}
        {variant === 'default' && (
          <>
            {BackButton}
            <p className="text-sb-16 text-gray-900">{title}</p>
            {showAction ? (
              <button
                type="button"
                onClick={onAction}
                className="hover:cursor-pointer text-sb-16 text-primary"
              >
                {actionLabel}
              </button>
            ) : (
              <div className="size-5" />
            )}
          </>
        )}
        {variant === 'home' && (
          <>
            <button
              type="button"
              onClick={onFilter}
              className="flex size-5 cursor-pointer items-center justify-center transition-all hover:opacity-60 active:scale-[0.95]"
              aria-label="필터"
            >
              <FilterIcon className="text-[#9C9C9C]" />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onChat}
              className="flex cursor-pointer items-center justify-center transition-all hover:opacity-60 active:scale-[0.95]"
              aria-label="채팅"
            >
              <ChatBadgeIcon count={chatCount} />
            </button>
          </>
        )}
      </header>
    )
  }
)
TopBar.displayName = 'TopBar'

export { TopBar, topBarVariants }
