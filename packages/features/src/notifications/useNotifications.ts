'use client'

import { useQuery, customFetch } from '@bconnect/api-client'
import type { AppNotification } from './types'

// TODO(BE notification 도메인 #347): 스펙 확정 시 generated useQuery 훅으로 교체.
// 알림 query SSOT — NotificationsView(목록) 와 진입점 뱃지(unread count) 가 같은 캐시를 공유한다.
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => customFetch<AppNotification[]>('/api/v1/notifications'),
  })
}

export function useUnreadNotificationCount(): number {
  const { data } = useNotifications()
  return data?.reduce((count, n) => (n.read ? count : count + 1), 0) ?? 0
}
