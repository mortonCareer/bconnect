import type { ReferencePathMap } from '@bconnect/push'

/**
 * 알림 `referenceType` → career 이동 목적지. `{id}` 는 `referenceId` 로 치환된다.
 * `{id}` 가 없는 패턴은 referenceId 없이도 이동하고, 표에 없는 타입은 읽음 처리만 한다.
 *
 * 이 표 하나를 Service Worker(백그라운드 푸시 클릭)·인앱 토스트·알림 목록이 공유한다.
 */
export const REFERENCE_PATHS: ReferencePathMap = {
  CHAT_ROOM: '/messages/{id}',
  PROFILE: '/profile/edit',
  COWORKER_REQUEST: '/profile/coworkers',
  CREDENTIAL: '/profile/certifications',
  RECOMMENDATION: '/profile/recommendations',
  // OFFER: 섭외 수신 화면 미구현(#842/#843) — 구현되면 '/offers/{id}' 추가
}
