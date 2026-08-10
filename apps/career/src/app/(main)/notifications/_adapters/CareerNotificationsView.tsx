'use client'

import { useRouter } from 'next/navigation'
import { NotificationsView } from '@bconnect/features'
import { resolveReferenceHref } from '@bconnect/push'
import type { Notification } from '@bconnect/api-client'
import { careerShell } from '@/app/(main)/_adapters/careerShell'
import { REFERENCE_PATHS } from '@/lib/notification-routes'

/** 목적지 표는 notification-routes.ts — Service Worker·인앱 토스트와 같은 표를 쓴다. */
function resolveHref(n: Notification): string | undefined {
  return resolveReferenceHref(REFERENCE_PATHS, n.referenceType, n.referenceId)
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
