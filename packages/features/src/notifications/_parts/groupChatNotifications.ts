import type { Notification } from '@bconnect/api-client'

export interface NotificationGroup {
  /** 대표(최신) 알림 — 표시에 사용 */
  representative: Notification
  /** 묶인 개수 (1 이면 단건) */
  count: number
  /** 그룹 내 안 읽은 알림이 하나라도 있으면 true */
  hasUnread: boolean
}

const CHAT_ROOM = 'CHAT_ROOM'

/**
 * 같은 채팅방(CHAT_ROOM + referenceId) 연속 알림을 한 그룹으로 접는다.
 * referenceId 가 채팅방 id 라 방마다 별도 그룹 — 방 A·B 는 섞이지 않고 같은 방만 병합.
 * 알림은 createdAt 내림차순이라 방당 메시지 폭탄은 연속 도착 → 연속 병합으로 충분.
 * 채팅 외 타입은 병합하지 않는다(각 단건). 표시 전용 — 원본 알림 row 는 개별 유지.
 */
export function groupChatNotifications(notifications: Notification[]): NotificationGroup[] {
  const groups: NotificationGroup[] = []

  for (const n of notifications) {
    const prev = groups.at(-1)
    const mergeable =
      n.referenceType === CHAT_ROOM &&
      n.referenceId != null &&
      prev?.representative.referenceType === CHAT_ROOM &&
      prev.representative.referenceId === n.referenceId

    if (mergeable) {
      prev.count += 1
      if (!n.read) prev.hasUnread = true
    } else {
      groups.push({ representative: n, count: 1, hasUnread: !n.read })
    }
  }

  return groups
}
