'use client'

import { useRouter, useSearchParams } from 'next/navigation'

/**
 * 현재 지원하는 패널 경로. #345 메시지/#347 알림 추가 시 union 확장.
 */
type PanelSegment = `/profile/${number}`

/**
 * plan `@panel` 슬롯 네비게이션 공통화 — 현재 query string 보존 + scroll:false.
 * 열기 href(`panelHref`), 닫기 href(`closeHref`)/액션(`close`)을 한 seam 으로.
 * 프로필(#344)·메시지(#345)·알림(#347) 트리거가 공유한다.
 */
export function usePanelNav() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qs = searchParams.toString()

  const withQs = (path: string) => (qs ? `${path}?${qs}` : path)
  const closeHref = withQs('/')

  return {
    panelHref: (segment: PanelSegment) => withQs(segment),
    closeHref,
    close: () => router.push(closeHref, { scroll: false }),
  }
}
