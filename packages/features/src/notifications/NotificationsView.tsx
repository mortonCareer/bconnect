'use client'

import { useQuery, useQueryClient, customFetch } from '@bconnect/api-client'
import { NotificationItem, Skeleton } from '@bconnect/ui'
import { formatRelativeTime } from '@bconnect/config/format'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { PanelMessage } from '../_shared/PanelMessage'
import type { AppNotification } from './types'

export interface NotificationsViewProps {
  closeHref: string
  onClose: () => void
}

export function NotificationsView({ closeHref, onClose }: NotificationsViewProps) {
  const queryClient = useQueryClient()
  // TODO(BE notification 도메인 #347): 스펙 확정 시 generated useQuery 훅으로 교체.
  // 현재는 독립 MSW placeholder(`/api/v1/notifications`) — customFetch 가 envelope unwrap.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => customFetch<AppNotification[]>('/api/v1/notifications'),
  })

  const markAllRead = () => {
    queryClient.setQueryData<AppNotification[]>(['notifications'], (prev) =>
      prev?.map((n) => (n.read ? n : { ...n, read: true }))
    )
  }

  return (
    <PanelShell
      title="알림"
      closeLabel="알림 패널 닫기"
      closeHref={closeHref}
      onClose={onClose}
      rightSlot={
        <button
          type="button"
          onClick={markAllRead}
          className="cursor-pointer whitespace-nowrap text-m-12 text-primary-500"
        >
          모두 읽음
        </button>
      }
    >
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
