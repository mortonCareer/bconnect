'use client'

import { useRouter } from 'next/navigation'
import { NotificationsView } from '@bconnect/features'
import type { Notification } from '@bconnect/api-client'
import { careerShell } from '@/app/(main)/_adapters/careerShell'

/**
 * 알림 유형(BE `referenceType`)별 career 이동 목적지.
 * CHAT_ROOM → 채팅방, PROFILE → 본인 프로필 편집(완성 넛지).
 * 나머지(OFFER·COWORKER_REQUEST·CONTRACT·NONE)는 아직 수신 화면 미구현(#842/#843) → 읽음 처리만.
 */
function resolveHref(n: Notification): string | undefined {
  switch (n.referenceType) {
    case 'CHAT_ROOM':
      return n.referenceId != null ? `/messages/${n.referenceId}` : undefined
    case 'PROFILE':
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
