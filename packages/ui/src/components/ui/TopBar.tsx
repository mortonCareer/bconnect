/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=189-720
 */
'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import * as React from 'react'
import { ChevronIcon, FilterIcon, ChatIcon, NotificationIcon } from '../../icons'
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

function CountBadge({ count }: { count?: number }) {
  if (count === undefined || count <= 0) return null
  return (
    <div className="absolute -right-[7.5px] -top-[3.5px] flex min-w-[15px] items-center justify-center rounded-full bg-destructive px-1">
      <span className="text-[10px] font-bold leading-[15px] text-white">
        {count > 99 ? '99+' : count}
      </span>
    </div>
  )
}

function ChatBadgeIcon({ count }: { count?: number }) {
  return (
    <div className="relative size-5">
      <ChatIcon className="text-[#a5a5a5]" />
      <CountBadge count={count} />
    </div>
  )
}

function NotifyBadgeIcon({ count }: { count?: number }) {
  return (
    <div className="relative size-5">
      <NotificationIcon className="text-[#a5a5a5]" />
      <CountBadge count={count} />
    </div>
  )
}

const iconButtonClass =
  'flex h-15 cursor-pointer items-center justify-center transition-all hover:opacity-60 active:scale-[0.95]'

/** 우측 알림·채팅 아이콘 그룹 — home + default(최상위 라우트, 예: 프로필) 우측에서 공유 */
function UtilityIcons({
  notifyHref,
  onNotify,
  notifyCount,
  chatHref,
  onChat,
  chatCount,
}: {
  notifyHref?: string
  onNotify?: () => void
  notifyCount?: number
  chatHref?: string
  onChat?: () => void
  chatCount?: number
}) {
  return (
    <div className="flex items-center">
      {notifyHref ? (
        <Link href={notifyHref} className={cn(iconButtonClass, 'pl-4 pr-2')} aria-label="알림">
          <NotifyBadgeIcon count={notifyCount} />
        </Link>
      ) : (
        onNotify && (
          <button
            type="button"
            onClick={onNotify}
            className={cn(iconButtonClass, 'pl-4 pr-2')}
            aria-label="알림"
          >
            <NotifyBadgeIcon count={notifyCount} />
          </button>
        )
      )}
      {chatHref ? (
        <Link href={chatHref} className={cn(iconButtonClass, '-mr-4 pl-2 pr-4')} aria-label="채팅">
          <ChatBadgeIcon count={chatCount} />
        </Link>
      ) : (
        onChat && (
          <button
            type="button"
            onClick={onChat}
            className={cn(iconButtonClass, '-mr-4 pl-2 pr-4')}
            aria-label="채팅"
          >
            <ChatBadgeIcon count={chatCount} />
          </button>
        )
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
  actionDisabled?: boolean
  showBack?: boolean
  chatCount?: number
  notifyCount?: number
  onFilter?: () => void
  onChat?: () => void
  onNotify?: () => void
  onBack?: () => void
  /** backHref가 있으면 Link로 렌더링 (prefetch), 없으면 button + onBack */
  backHref?: string
  /** chatHref가 있으면 Link(prefetch)로 렌더링, 없으면 button + onChat */
  chatHref?: string
  /** notifyHref/onNotify 중 하나라도 있으면 알림 버튼 렌더. href면 Link(prefetch) */
  notifyHref?: string
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
      actionDisabled = false,
      showBack = true,
      chatCount,
      notifyCount,
      onFilter,
      onChat,
      onNotify,
      onBack,
      backHref,
      chatHref,
      notifyHref,
      ...props
    },
    ref
  ) => {
    const backButtonClass =
      'flex size-5 cursor-pointer items-center justify-center transition-all hover:opacity-60 active:scale-[0.95]'
    const hasUtility = !!(chatHref || onChat || notifyHref || onNotify)

    const BackButton = !showBack ? (
      <div className="size-5" />
    ) : backHref ? (
      <Link href={backHref} className={backButtonClass} aria-label="뒤로가기">
        <ChevronIcon direction="left" className="text-[#a5a5a5]" />
      </Link>
    ) : (
      <button type="button" onClick={onBack} className={backButtonClass} aria-label="뒤로가기">
        <ChevronIcon direction="left" className="text-[#a5a5a5]" />
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
            {hasUtility ? (
              <UtilityIcons
                notifyHref={notifyHref}
                onNotify={onNotify}
                notifyCount={notifyCount}
                chatHref={chatHref}
                onChat={onChat}
                chatCount={chatCount}
              />
            ) : showAction ? (
              <button
                type="button"
                onClick={onAction}
                disabled={actionDisabled}
                className={cn(
                  'text-sb-16',
                  actionDisabled
                    ? 'cursor-default text-gray-400'
                    : 'text-primary hover:cursor-pointer'
                )}
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
              className={cn(iconButtonClass, '-ml-4 px-4')}
              aria-label="필터"
            >
              <FilterIcon className="text-[#a5a5a5]" />
            </button>
            <div className="flex-1" />
            <UtilityIcons
              notifyHref={notifyHref}
              onNotify={onNotify}
              notifyCount={notifyCount}
              chatHref={chatHref}
              onChat={onChat}
              chatCount={chatCount}
            />
          </>
        )}
      </header>
    )
  }
)
TopBar.displayName = 'TopBar'

export { TopBar, topBarVariants }
