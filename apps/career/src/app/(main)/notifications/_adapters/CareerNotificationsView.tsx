'use client'

import { useRouter } from 'next/navigation'
import { NotificationsView } from '@bconnect/features'
import type { Notification } from '@bconnect/api-client'
import { careerShell } from '@/app/(main)/_adapters/careerShell'

/**
 * 알림 유형(BE `referenceType`)별 career 이동 목적지.
 * chat_room → 채팅방, profile → 본인 프로필 편집(완성 넛지).
 * 나머지(offer·coworker_request·contract·none)는 아직 수신 화면 미구현(#842/#843) → 읽음 처리만.
 * BE 는 referenceType 을 소문자로 내려준다(NotificationResponse.of: `.name().toLowerCase()`) — 방어적으로 정규화.
 */
function resolveHref(n: Notification): string | undefined {
  switch (n.referenceType?.toLowerCase()) {
    case 'chat_room':
      return n.referenceId != null ? `/messages/${n.referenceId}` : undefined
    case 'profile':
      return '/profile/edit'
    default:
      return undefined
  }
}

/** 알림 (/notifications) — 공용 NotificationsView 가 자체 fetch. career 풀페이지 셸(back→홈) 주입. */
export function CareerNotificationsView() {
  const router = useRouter()
  return (
    <NotificationsView
      renderShell={careerShell(() => router.push('/'))}
      resolveHref={resolveHref}
    />
  )
}
