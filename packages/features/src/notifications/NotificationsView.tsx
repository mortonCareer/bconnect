'use client'

import type { ReactNode } from 'react'
import { useQueryClient } from '@bconnect/api-client'
import { NotificationItem, Skeleton } from '@bconnect/ui'
import { formatRelativeTime } from '@bconnect/config/format'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { PanelMessage } from '../_shared/PanelMessage'
import { useNotifications } from './useNotifications'
import type { AppNotification } from './types'

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
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useNotifications()

  const markAllRead = () => {
    queryClient.setQueryData<AppNotification[]>(['notifications'], (prev) =>
      prev?.map((n) => (n.read ? n : { ...n, read: true }))
    )
  }

  const hasItems = !!data && data.length > 0

  const body = (
    <>
      {hasItems && (
        <div className="flex justify-end px-4 py-2">
          <button
            type="button"
            onClick={markAllRead}
            className="cursor-pointer whitespace-nowrap text-m-12 text-primary-500"
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
        ) : !data || data.length === 0 ? (
          <PanelMessage>새로운 알림이 없습니다</PanelMessage>
        ) : (
          <ul className="flex flex-col">
            {data.map((n) => (
              <li key={n.id} className="contents">
                <NotificationItem
                  content={n.body}
                  timestamp={formatRelativeTime(n.createdAt)}
                  read={n.read}
                />
              </li>
            ))}
          </ul>
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
