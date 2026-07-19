'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useUpdateNotificationsRead } from '@bconnect/api-client'
import { NotificationItem, Skeleton } from '@bconnect/ui'
import { formatRelativeTime } from '@bconnect/config/format'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { PanelMessage } from '../_shared/PanelMessage'
import { useNotifications } from './useNotifications'
import { groupChatNotifications } from './_parts/groupChatNotifications'

type NotificationsViewShellProps =
  | {
      /** 풀페이지 등 비-패널 쉘 주입 (career 풀페이지 라우트) */
      renderShell: (props: { title: string; children: ReactNode }) => ReactNode
      closeHref?: never
      onClose?: never
    }
  | {
      /** 기본 @panel 쉘 (plan) */
      renderShell?: never
      closeHref: string
      onClose: () => void
    }

export type NotificationsViewProps = NotificationsViewShellProps

export function NotificationsView(props: NotificationsViewProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications()
  const { mutate: markAllRead, isPending: isMarkingAllRead } = useUpdateNotificationsRead()

  const notifications = data?.pages.flatMap((page) => page.content ?? []) ?? []
  const groups = groupChatNotifications(notifications)
  const hasItems = groups.length > 0

  const bottomObserverRef = useRef<HTMLDivElement>(null)
  const handleBottomObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    const target = bottomObserverRef.current
    if (!target) return
    const observer = new IntersectionObserver(handleBottomObserver)
    observer.observe(target)
    return () => observer.disconnect()
  }, [handleBottomObserver])

  const body = (
    <>
      {hasItems && (
        <div className="flex justify-end px-4 py-2">
          <button
            type="button"
            onClick={() => markAllRead()}
            disabled={isMarkingAllRead}
            className="cursor-pointer whitespace-nowrap text-m-12 text-primary-500 disabled:opacity-50"
          >
            모두 읽음
          </button>
        </div>
      )}
      <PanelScroll>
        {isLoading ? (
          <NotificationsSkeleton />
        ) : isError ? (
          <PanelMessage>알림을 불러올 수 없습니다</PanelMessage>
        ) : !hasItems ? (
          <PanelMessage>새로운 알림이 없습니다</PanelMessage>
        ) : (
          <>
            <ul className="flex flex-col">
              {groups.map(({ representative: n, count, hasUnread }) => (
                <li key={n.id} className="contents">
                  <NotificationItem
                    profileImage={n.sender?.picture}
                    content={count > 1 ? `${n.message ?? ''} · ${count}개` : (n.message ?? '')}
                    timestamp={formatRelativeTime(n.createdAt ?? '')}
                    read={!hasUnread}
                  />
                </li>
              ))}
            </ul>
            <div ref={bottomObserverRef} className="h-px" aria-hidden />
            {isFetchingNextPage && <NotificationsSkeleton />}
          </>
        )}
      </PanelScroll>
    </>
  )

  if (props.renderShell) {
    return <>{props.renderShell({ title: '알림', children: body })}</>
  }

  return (
    <PanelShell
      title="알림"
      closeLabel="알림 패널 닫기"
      closeHref={props.closeHref}
      onClose={props.onClose}
    >
      {body}
    </PanelShell>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  )
}
