/**
 * 알림 도메인 FE-provisional 타입 — BE 미구현(스펙·엔드포인트 부재), 이 파일이 잠정 SSOT.
 * TODO(BE notification 도메인 #347): `/api/v1/notifications` 스펙 확정 시 orval generated 타입으로 교체.
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
