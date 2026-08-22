'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * 현재 지원하는 패널 세그먼트 (= `?panel=` 값 그대로). 프로필(#344)·메시지(#345/#346)·알림(#347)
 * 트리거가 공유. 프로필 하위 패널(동료·추천서, #557)은 프로필 stats 클릭으로 진입 (ADR-0021).
 * 작업 편집 패널(task)은 공정표 우클릭 수정(#576)으로 진입 — PanelHost 측 구현은 #575-B.
 */
export type PanelSegment =
  | `profile/${number}`
  | `profile/${number}/coworkers`
  | `profile/${number}/recommendations`
  | `crawled/${number}`
  | 'messages'
  | `messages/${number}`
  | 'notifications'
  | `task/${string}`

/**
 * plan 패널 네비게이션 공통화 (ADR-0021: search param 기반).
 *
 * 패널 정체성을 메인 콘텐츠 path 와 분리해 `?panel=<segment>` 로 인코딩한다. 덕분에 패널이
 * 어떤 메인 라우트(기술자 탐색·공정표 등) 위에도 공존하며, 새로고침·뒤로/앞으로·공유가 URL 로 추적된다.
 * 메인 path 와 다른 search param(필터 등)은 그대로 보존한다.
 *
 * 열기 href(`panelHref`)/액션(`openPanel`), 닫기 href(`closeHref`)/액션(`close`)을 한 seam 으로.
 */
export function usePanelNav() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 패널 외 추가 search param 동시 set/clear (null = 삭제). 예: 프로필 열며 task 컨텍스트(`?task=`) 동봉.
  const hrefWithPanel = (panelValue: string | null, extra?: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (panelValue) params.set('panel', panelValue)
    else params.delete('panel')
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        if (value === null) params.delete(key)
        else params.set(key, value)
      }
    }
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const closeHref = hrefWithPanel(null)

  return {
    /** 현재 열린 패널 세그먼트 (`?panel=` 값 그대로, 없으면 null). 사이드바 active 표시 등 읽기용. */
    panel: searchParams.get('panel'),
    panelHref: (segment: PanelSegment, extra?: Record<string, string | null>) =>
      hrefWithPanel(segment, extra),
    openPanel: (segment: PanelSegment, extra?: Record<string, string | null>) =>
      router.push(hrefWithPanel(segment, extra), { scroll: false }),
    closeHref,
    close: () => router.push(closeHref, { scroll: false }),
  }
}
