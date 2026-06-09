'use client'

import { useRouter } from 'next/navigation'
import { NotificationsView } from '@bconnect/features'
import { careerShell } from '@/app/(main)/_adapters/careerShell'

/** 알림 (/notifications) — 공용 NotificationsView 가 자체 fetch. career 풀페이지 셸(back→홈) 주입. */
export function CareerNotificationsView() {
  const router = useRouter()
  return <NotificationsView renderShell={careerShell(() => router.push('/'))} />
}
