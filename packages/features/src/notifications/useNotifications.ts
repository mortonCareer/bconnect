'use client'

import {
  useInfiniteQuery,
  getNotifications,
  getGetNotificationsQueryKey,
  useGetNotificationsUnreadCount,
  useAuthHint,
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

// 공개 페이지(career 홈·공개 프로필)에도 마운트되는 인증 필요 조회 — 로그아웃 상태면 정지(#802).
// features 는 앱 상태를 못 보므로 proxy 가드와 같은 힌트 쿠키(useAuthHint)로 판정.
export function useUnreadNotificationCount(): number | undefined {
  const enabled = useAuthHint()
  const { data } = useGetNotificationsUnreadCount({ query: { enabled } })
  return data
}
