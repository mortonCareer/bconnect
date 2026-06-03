'use client'

import { useRouter, useSearchParams } from 'next/navigation'

/**
 * 현재 지원하는 패널 경로. 프로필(#344)·메시지(#345/#346)·알림(#347) 트리거가 공유.
 */
type PanelSegment = `/profile/${number}` | '/messages' | `/messages/${number}` | '/notifications'

/**
 * plan `@panel` 슬롯 네비게이션 공통화 — 현재 query string 보존 + scroll:false.
 * 열기 href(`panelHref`)/액션(`openPanel`), 닫기 href(`closeHref`)/액션(`close`)을 한 seam 으로.
 * 프로필(#344)·메시지(#345/#346)·알림(#347) 트리거가 공유한다.
 */
export function usePanelNav() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qs = searchParams.toString()

  const withQs = (path: string) => (qs ? `${path}?${qs}` : path)
  const closeHref = withQs('/')

  return {
    panelHref: (segment: PanelSegment) => withQs(segment),
    openPanel: (segment: PanelSegment) => router.push(withQs(segment), { scroll: false }),
    closeHref,
    close: () => router.push(closeHref, { scroll: false }),
  }
}
