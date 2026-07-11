'use client'

import {
  useInfiniteQuery,
  getNotifications,
  getGetNotificationsQueryKey,
  useGetNotificationsUnreadCount,
} from '@bconnect/api-client'
import type { CursorPageNotification, InfiniteData } from '@bconnect/api-client'

export function useNotifications() {
  return useInfiniteQuery<
    CursorPageNotification,
    Error,
    InfiniteData<CursorPageNotification>,
    readonly unknown[],
    number | undefined
  >({
    queryKey: getGetNotificationsQueryKey(),
    queryFn: ({ pageParam }) => getNotifications({ cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  })
}

export function useUnreadNotificationCount(): number | undefined {
  const { data } = useGetNotificationsUnreadCount()
  return data
}
