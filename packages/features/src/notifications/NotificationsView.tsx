'use client'

import { useEffect, useRef } from 'react'
import { useQuery, customFetch } from '@bconnect/api-client'
import { Skeleton } from '@bconnect/ui'
import { PanelHeader } from '../_shared/PanelHeader'
import type { AppNotification } from './types'

export interface NotificationsViewProps {
  closeHref: string
  onClose: () => void
}

export function NotificationsView({ closeHref, onClose }: NotificationsViewProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // TODO(BE notification 도메인 #347): 스펙 확정 시 generated useQuery 훅으로 교체.
  // 현재는 독립 MSW placeholder(`/api/v1/notifications`) — customFetch 가 envelope unwrap.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => customFetch<AppNotification[]>('/api/v1/notifications'),
  })

  return (
    <div ref={rootRef} tabIndex={-1} className="flex h-full flex-col bg-white outline-none">
      <PanelHeader title="알림" closeLabel="알림 패널 닫기" closeHref={closeHref} />
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : isError ? (
          <PanelMessage>알림을 불러올 수 없습니다</PanelMessage>
        ) : !data || data.length === 0 ? (
          <PanelMessage>새로운 알림이 없습니다</PanelMessage>
        ) : (
          <ul className="flex flex-col">
            {data.map((n) => (
              <li
                key={n.id}
                className={`flex flex-col gap-1 border-b border-gray-100 px-4 py-3 ${
                  n.read ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <span className="text-sb-14 text-gray-900">{n.title}</span>
                <span className="text-r-14 text-gray-700">{n.body}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function PanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-20 text-center">
      <p className="text-r-14 text-gray-500">{children}</p>
    </div>
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
