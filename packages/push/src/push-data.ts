import type { NotificationReferenceType } from '@bconnect/api-client'

/**
 * 푸시 `data.reference_type` 값 — BE(SnsPushSender)가 enum 이름을 소문자로 넣는다.
 * REST 스펙에서 생성된 enum 에 매달아, BE 가 값을 추가·삭제하면 여기도 따라간다.
 * 대상이 없는 알림(가입 환영 등)은 빈 문자열.
 */
export type PushReferenceType = Lowercase<NotificationReferenceType> | ''

/**
 * FCM 푸시 `data` 계약 (SnsPushSender.message). 값은 FCM 규약상 전부 문자열.
 * Firebase SDK 의 `data` 는 인덱스 시그니처라 키 오타를 못 잡으므로 이 타입으로 좁힌다.
 *
 * interface 가 아니라 type alias — 발송 측(firebase-admin)의 `Record<string, string>` 에
 * 넣으려면 암묵적 인덱스 시그니처가 필요하고, 그건 type alias 에만 생긴다.
 */
export type PushData = {
  notification_id: string
  reference_type: PushReferenceType
  reference_id: string
}
