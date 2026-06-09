'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * 현재 지원하는 패널 경로. 프로필(#344)·메시지(#345/#346)·알림(#347) 트리거가 공유.
 * 프로필 하위 패널(동료·추천서, #557)은 프로필 stats 클릭으로 진입.
 *
 * leading slash 형태(`/profile/5`)는 호출부 가독성을 위한 표기 — 내부적으로 `?panel=profile/5`
 * search param 으로 인코딩된다 (ADR-0021).
 */
type PanelSegment =
  | `/profile/${number}`
  | `/profile/${number}/coworkers`
  | `/profile/${number}/recommendations`
  | '/messages'
  | `/messages/${number}`
  | '/notifications'

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

  // panel 값만 set/clear, 나머지 search param 은 보존
  const hrefWithPanel = (panelValue: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (panelValue) params.set('panel', panelValue)
    else params.delete('panel')
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const toParam = (segment: PanelSegment) => segment.replace(/^\//, '')
  const closeHref = hrefWithPanel(null)

  return {
    panelHref: (segment: PanelSegment) => hrefWithPanel(toParam(segment)),
    openPanel: (segment: PanelSegment) =>
      router.push(hrefWithPanel(toParam(segment)), { scroll: false }),
    closeHref,
    close: () => router.push(closeHref, { scroll: false }),
  }
}
