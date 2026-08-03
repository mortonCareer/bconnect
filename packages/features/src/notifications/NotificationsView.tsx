'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import {
  updateNotificationRead,
  useUpdateNotificationsRead,
  useQueryClient,
  getGetNotificationsQueryKey,
  getGetNotificationsUnreadCountQueryKey,
} from '@bconnect/api-client'
import type { Notification } from '@bconnect/api-client'
import { NotificationItem, Skeleton } from '@bconnect/ui'
import { formatRelativeTime } from '@bconnect/config/format'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { PanelMessage } from '../_shared/PanelMessage'
import { useNotifications, useUnreadNotificationCount } from './useNotifications'
import { groupChatNotifications } from './_parts/groupChatNotifications'

type NotificationsViewShellProps =
  | {
      /**
       * 풀페이지 등 비-패널 쉘 주입 (career 풀페이지 라우트).
       * 헤더 슬롯(`titleCount`·`rightSlot`)은 패널 쉘(`PanelShell`)과 같은 이름으로 관통시킨다 (#1016).
       */
      renderShell: (props: {
        title: string
        titleCount?: number
        rightSlot?: ReactNode
        children: ReactNode
      }) => ReactNode
      closeHref?: never
      onClose?: never
    }
  | {
      /** 기본 패널 쉘 (plan) */
      renderShell?: never
      closeHref: string
      onClose: () => void
    }

export type NotificationsViewProps = NotificationsViewShellProps & {
  /**
   * 알림 클릭 시 이동할 목적지 href. `undefined` 를 반환하면 이동 없이 읽음 처리만 한다.
   * 앱별 라우팅(career 경로 / plan `?panel=`)이 달라 앱에서 주입한다.
   */
  resolveHref?: (notification: Notification) => string | undefined
}

export function NotificationsView(props: NotificationsViewProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications()
  const { mutate: markAllRead, isPending: isMarkingAllRead } = useUpdateNotificationsRead()
  const unreadCount = useUnreadNotificationCount()
  const queryClient = useQueryClient()

  // 그룹 내 안 읽은 id 를 전부 개별 읽음 처리하고(bulk-by-id 엔드포인트 없음) 마지막에 한 번만 무효화.
  // 개별 hook 을 N 번 부르면 성공마다 재조회가 몰리므로(thundering) raw 함수 + 단일 invalidate.
  const readOnClick = (unreadIds: number[]) => {
    if (unreadIds.length === 0) return
    void Promise.all(unreadIds.map((id) => updateNotificationRead(id))).then(() => {
      queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() })
      queryClient.invalidateQueries({ queryKey: getGetNotificationsUnreadCountQueryKey() })
    })
  }

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

  const markAllReadButton = hasItems ? (
    <button
      type="button"
      onClick={() => markAllRead()}
      disabled={isMarkingAllRead}
      className="cursor-pointer whitespace-nowrap text-m-12 text-primary-500 disabled:opacity-50"
    >
      모두 읽음
    </button>
  ) : null

  const body = (
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
            {groups.map(({ representative: n, unreadIds, count }) => {
              const href = props.resolveHref?.(n)
              const content = count > 1 ? `${n.message ?? ''} · ${count}개` : (n.message ?? '')
              const item = (
                <NotificationItem
                  profileImage={n.senderMember?.picture ?? n.senderCompany?.picture ?? undefined}
                  content={content}
                  timestamp={formatRelativeTime(n.createdAt ?? '')}
                  read={unreadIds.length === 0}
                />
              )
              return (
                <li key={n.id} className="contents">
                  {href ? (
                    <Link href={href} onClick={() => readOnClick(unreadIds)} className="block">
                      {item}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => readOnClick(unreadIds)}
                      className="block w-full text-left"
                    >
                      {item}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          <div ref={bottomObserverRef} className="h-px" aria-hidden />
          {isFetchingNextPage && <NotificationsSkeleton />}
        </>
      )}
    </PanelScroll>
  )

  if (props.renderShell) {
    return (
      <>
        {props.renderShell({
          title: '알림',
          titleCount: unreadCount,
          rightSlot: markAllReadButton,
          children: body,
        })}
      </>
    )
  }

  return (
    <PanelShell
      title="알림"
      titleCount={unreadCount}
      rightSlot={markAllReadButton}
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
