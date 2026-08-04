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
  // OFFER: 목적지는 채팅방 안 섭외 제안 카드(#972)지만, referenceId 가 offerId 라
  //        어느 채팅방인지 지목할 수 없다 (OfferResponse 에 chatId 없음).
  // CONTRACT: BE 에 발행처 없음 — enum 에만 존재.
}
