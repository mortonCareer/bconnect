/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=189-720
 */
'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { ChevronLeftIcon } from '../../icons'
import { cn } from '../../lib/utils'

const topBarVariants = cva('flex h-[60px] w-full items-center bg-white px-4', {
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

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M2.5 5.83333H17.5M5 10H15M7.5 14.1667H12.5"
        stroke="#9C9C9C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChatIcon({ className, count }: { className?: string; count?: number }) {
  return (
    <div className={cn('relative size-5', className)}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M17.5 9.58333C17.5029 10.6832 17.2459 11.7683 16.75 12.75C16.162 13.9265 15.2581 14.916 14.1395 15.6078C13.021 16.2995 11.7319 16.6662 10.4167 16.6667C9.31678 16.6696 8.23176 16.4126 7.25 15.9167L2.5 17.5L4.08333 12.75C3.58744 11.7683 3.33047 10.6832 3.33333 9.58333C3.33384 8.26812 3.70051 6.97905 4.39227 5.86045C5.08402 4.74185 6.07355 3.83797 7.25 3.25C8.23176 2.75411 9.31678 2.49713 10.4167 2.5H10.8333C12.5703 2.59583 14.2109 3.32897 15.4409 4.55907C16.671 5.78917 17.4042 7.42971 17.5 9.16667V9.58333Z"
          stroke="#9C9C9C"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
        <ChevronLeftIcon className="text-[#9C9C9C]" />
      </a>
    ) : (
      <button type="button" onClick={onBack} className={backButtonClass} aria-label="뒤로가기">
        <ChevronLeftIcon className="text-[#9C9C9C]" />
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
              <FilterIcon />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onChat}
              className="flex cursor-pointer items-center justify-center transition-all hover:opacity-60 active:scale-[0.95]"
              aria-label="채팅"
            >
              <ChatIcon count={chatCount} />
            </button>
          </>
        )}
      </header>
    )
  }
)
TopBar.displayName = 'TopBar'

export { TopBar, topBarVariants }
