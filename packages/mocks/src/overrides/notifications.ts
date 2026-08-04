import {
  getGetNotificationsMockHandler,
  getGetNotificationsUnreadCountMockHandler,
  getUpdateNotificationReadMockHandler,
  getUpdateNotificationsReadMockHandler,
  NotificationReferenceType,
  NotificationSenderType,
} from '@bconnect/api-client'
import type { Notification } from '@bconnect/api-client'

// 알림 목록·읽음 상태 stateful override — faker 랜덤이면 커서 페이지네이션이
// (임의 hasNext/nextCursor 로) 무한 반복되고, 읽음 처리 후에도 뱃지가 안 줄어 GUI 검증 불가.

const MOCK_MEMBER_ID = 1

// BE NotificationType 의 템플릿 미러 — 문구가 갈리면 mock 이 실제와 달라진다.
const TEMPLATES: Record<string, string> = {
  CHAT_MESSAGE: '%s님이 메시지를 보냈습니다',
  SIGNUP_WELCOME: '회원가입을 축하드립니다',
  PROFILE_COMPLETION: '프로필을 완성하고 업체로부터 일감을 받아보세요',
  COWORKER_REQUESTED: '%s 님으로부터 동료 요청을 제안받았습니다',
  OFFER_RECEIVED: '%s으로부터 섭외 요청을 제안받았습니다',
  CONTRACT_WRITTEN: '%s 님으로부터 계약서를 작성받았습니다',
}

const REFERENCE_TYPE: Record<string, NotificationReferenceType | null> = {
  CHAT_MESSAGE: NotificationReferenceType.CHAT_ROOM,
  SIGNUP_WELCOME: null,
  PROFILE_COMPLETION: NotificationReferenceType.PROFILE,
  COWORKER_REQUESTED: NotificationReferenceType.COWORKER_REQUEST,
  OFFER_RECEIVED: NotificationReferenceType.OFFER,
  CONTRACT_WRITTEN: NotificationReferenceType.CONTRACT,
}

interface NotificationSeed {
  type: string
  /** 빈 문자열이면 시스템 발신(가입 축하·프로필 완성) — 발신자 카드 없음 */
  senderName: string
  senderType: NotificationSenderType
  daysAgo: number
  read: boolean
}

const SEEDS: NotificationSeed[] = [
  {
    type: 'CHAT_MESSAGE',
    senderName: '김기술',
    senderType: NotificationSenderType.MEMBER,
    daysAgo: 0,
    read: false,
  },
  {
    type: 'OFFER_RECEIVED',
    senderName: '서정건축',
    senderType: NotificationSenderType.COMPANY,
    daysAgo: 1,
    read: false,
  },
  {
    type: 'COWORKER_REQUESTED',
    senderName: '박영희',
    senderType: NotificationSenderType.MEMBER,
    daysAgo: 2,
    read: false,
  },
  {
    type: 'CONTRACT_WRITTEN',
    senderName: '이준호',
    senderType: NotificationSenderType.MEMBER,
    daysAgo: 3,
    read: true,
  },
  {
    type: 'CHAT_MESSAGE',
    senderName: '최민수',
    senderType: NotificationSenderType.MEMBER,
    daysAgo: 4,
    read: true,
  },
  {
    type: 'PROFILE_COMPLETION',
    senderName: '',
    senderType: NotificationSenderType.MEMBER,
    daysAgo: 6,
    read: true,
  },
  {
    type: 'CHAT_MESSAGE',
    senderName: '한상우',
    senderType: NotificationSenderType.MEMBER,
    daysAgo: 8,
    read: true,
  },
  {
    type: 'OFFER_RECEIVED',
    senderName: '대원인테리어',
    senderType: NotificationSenderType.COMPANY,
    daysAgo: 11,
    read: true,
  },
  {
    type: 'CHAT_MESSAGE',
    senderName: '정다혜',
    senderType: NotificationSenderType.MEMBER,
    daysAgo: 14,
    read: true,
  },
  {
    type: 'CONTRACT_WRITTEN',
    senderName: '서정건축',
    senderType: NotificationSenderType.COMPANY,
    daysAgo: 18,
    read: true,
  },
  {
    type: 'CHAT_MESSAGE',
    senderName: '김기술',
    senderType: NotificationSenderType.MEMBER,
    daysAgo: 22,
    read: true,
  },
  {
    type: 'SIGNUP_WELCOME',
    senderName: '',
    senderType: NotificationSenderType.MEMBER,
    daysAgo: 30,
    read: true,
  },
]

const DAY_MS = 24 * 60 * 60 * 1000

// 채팅 알림은 실제 mock 채팅방(chats.ts: id 1~3)으로 이동하도록 referenceId 를 연결.
const CHAT_ROOM_IDS = [1, 2, 3]

// id 내림차순(최신순) — BE 커서(keyset, id 기준)와 동일한 정렬 의미
const notifications: Notification[] = SEEDS.map((seed, i) => {
  const referenceType = REFERENCE_TYPE[seed.type] ?? null
  const referenceId =
    referenceType === null
      ? null
      : referenceType === NotificationReferenceType.CHAT_ROOM
        ? (CHAT_ROOM_IDS[i % CHAT_ROOM_IDS.length] ?? null)
        : 100 + i
  const createdAt = new Date(Date.now() - seed.daysAgo * DAY_MS).toISOString()
  const senderId = 100 + i
  const isCompanySender = seed.senderType === NotificationSenderType.COMPANY
  const hasSender = seed.senderName !== ''

  return {
    id: SEEDS.length - i,
    memberId: MOCK_MEMBER_ID,
    type: seed.type,
    senderType: seed.senderType,
    senderMember:
      hasSender && !isCompanySender
        ? {
            id: senderId,
            name: seed.senderName,
            username: `user${senderId}`,
            picture: null,
          }
        : null,
    senderCompany: isCompanySender
      ? {
          id: senderId,
          memberId: senderId,
          name: seed.senderName,
          brn: '000-00-00000',
          picture: `https://picsum.photos/seed/bconnect-company-${senderId}/200/200`,
          createdAt,
          modifiedAt: createdAt,
        }
      : null,
    message: (TEMPLATES[seed.type] ?? '').replace('%s', seed.senderName),
    referenceType,
    referenceId,
    read: seed.read,
    createdAt,
  }
})

const DEFAULT_LIMIT = 20

export const notificationsOverrides = [
  getGetNotificationsMockHandler(({ request }) => {
    const url = new URL(request.url)
    const cursor = Number(url.searchParams.get('cursor')) || undefined
    const limit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT
    const remaining =
      cursor === undefined ? notifications : notifications.filter((n) => (n.id ?? 0) < cursor)
    const content = remaining.slice(0, limit)
    const hasNext = remaining.length > limit
    return {
      content,
      hasNext,
      nextCursor: hasNext ? content[content.length - 1]?.id : undefined,
    }
  }),

  getGetNotificationsUnreadCountMockHandler(() => notifications.filter((n) => !n.read).length),

  getUpdateNotificationReadMockHandler(({ params }) => {
    const target = notifications.find((n) => n.id === Number(params.id))
    if (target) target.read = true
    return { success: true }
  }),

  getUpdateNotificationsReadMockHandler(() => {
    notifications.forEach((n) => {
      n.read = true
    })
    return { success: true }
  }),
]
