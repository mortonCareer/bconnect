/**
 * 알림 도메인은 BE 미구현(스펙·엔드포인트 부재) — FE-provisional 타입.
 * 이 파일이 잠정 SSOT. BE `/api/v1/notifications` 스펙 확정 시 orval generated 타입으로 이관.
 */
export type NotificationType = 'CHAT' | 'RECOMMENDATION' | 'SYSTEM'

export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  body: string
  read: boolean
  createdAt: string
}
