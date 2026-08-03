import type { ReferencePathMap } from '@bconnect/push'

/**
 * 알림 `referenceType` → plan 패널 세그먼트(`?panel=` 값). `{id}` 는 `referenceId` 로 치환된다.
 * 표에 없는 타입은 읽음 처리만 한다 — 대부분의 알림이 기술자(career) 대상이라 plan 목적지가 없다.
 */
export const REFERENCE_PANEL_SEGMENTS: ReferencePathMap = {
  CHAT_ROOM: 'messages/{id}',
  // OFFER: 업체 오너도 수신하지만 plan 에 섭외 화면 없음 — 구현되면 추가
}

/**
 * Service Worker·인앱 토스트용 href 패턴. 위 세그먼트 표에서 파생한다 (SSOT 는 세그먼트 표).
 * 상대 URL 이라 클릭 시점의 메인 경로를 유지한 채 패널만 열린다.
 */
export const REFERENCE_PATHS: ReferencePathMap = Object.fromEntries(
  Object.entries(REFERENCE_PANEL_SEGMENTS).map(([type, segment]) => [type, `?panel=${segment}`])
)
