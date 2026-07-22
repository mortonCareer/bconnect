import {
  getGetNotificationsMockHandler,
  getGetNotificationsUnreadCountMockHandler,
  getUpdateNotificationReadMockHandler,
  getUpdateNotificationsReadMockHandler,
  Role,
} from '@bconnect/api-client'
import type { Notification } from '@bconnect/api-client'

// 알림 목록·읽음 상태 stateful override — faker 랜덤이면 커서 페이지네이션이
// (임의 hasNext/nextCursor 로) 무한 반복되고, 읽음 처리 후에도 뱃지가 안 줄어 GUI 검증 불가.

interface NotificationSeed {
  type: string
  message: string
  senderName: string
  daysAgo: number
  read: boolean
}

const SEEDS: NotificationSeed[] = [
  {
    type: 'CHAT_MESSAGE',
    message: '김기술님이 메시지를 보냈습니다.',
    senderName: '김기술',
    daysAgo: 0,
    read: false,
  },
  {
    type: 'OFFER_RECEIVED',
    message: '서정건축님이 작업을 제안했습니다.',
    senderName: '서정건축',
    daysAgo: 1,
    read: false,
  },
  {
    type: 'COWORKER_REQUESTED',
    message: '박영희님이 동료 요청을 보냈습니다.',
    senderName: '박영희',
    daysAgo: 2,
    read: false,
  },
  {
    type: 'CONTRACT_WRITTEN',
    message: '이준호님이 계약서를 작성했습니다.',
    senderName: '이준호',
    daysAgo: 3,
    read: true,
  },
  {
    type: 'CHAT_MESSAGE',
    message: '최민수님이 메시지를 보냈습니다.',
    senderName: '최민수',
    daysAgo: 4,
    read: true,
  },
  {
    type: 'PROFILE_COMPLETION',
    message: '프로필을 완성하고 더 많은 제안을 받아보세요.',
    senderName: '',
    daysAgo: 6,
    read: true,
  },
  {
    type: 'CHAT_MESSAGE',
    message: '한상우님이 메시지를 보냈습니다.',
    senderName: '한상우',
    daysAgo: 8,
    read: true,
  },
  {
    type: 'OFFER_RECEIVED',
    message: '대원인테리어님이 작업을 제안했습니다.',
    senderName: '대원인테리어',
    daysAgo: 11,
    read: true,
  },
  {
    type: 'CHAT_MESSAGE',
    message: '정다혜님이 메시지를 보냈습니다.',
    senderName: '정다혜',
    daysAgo: 14,
    read: true,
  },
  {
    type: 'CONTRACT_WRITTEN',
    message: '서정건축님이 계약서를 작성했습니다.',
    senderName: '서정건축',
    daysAgo: 18,
    read: true,
  },
  {
    type: 'CHAT_MESSAGE',
    message: '김기술님이 메시지를 보냈습니다.',
    senderName: '김기술',
    daysAgo: 22,
    read: true,
  },
  {
    type: 'SIGNUP_WELCOME',
    message: '가입을 축하합니다! 품앗이를 시작해보세요.',
    senderName: '',
    daysAgo: 30,
    read: true,
  },
]

const DAY_MS = 24 * 60 * 60 * 1000

// 알림 type → referenceType. BE NotificationResponse 는 referenceType 을 소문자로 직렬화하므로
// (`type.referenceType().name().toLowerCase()`) mock 도 소문자로 맞춘다.
const REFERENCE_TYPE: Record<string, string> = {
  CHAT_MESSAGE: 'chat_room',
  SIGNUP_WELCOME: 'none',
  PROFILE_COMPLETION: 'profile',
  COWORKER_REQUESTED: 'coworker_request',
  OFFER_RECEIVED: 'offer',
  CONTRACT_WRITTEN: 'contract',
}

// 채팅 알림은 실제 mock 채팅방(chats.ts: id 1~3)으로 이동하도록 referenceId 를 연결.
const CHAT_ROOM_IDS = [1, 2, 3]

// id 내림차순(최신순) — BE 커서(keyset, id 기준)와 동일한 정렬 의미
const notifications: Notification[] = SEEDS.map((seed, i) => {
  const referenceType = REFERENCE_TYPE[seed.type] ?? 'none'
  const referenceId =
    referenceType === 'none'
      ? null
      : referenceType === 'chat_room'
        ? (CHAT_ROOM_IDS[i % CHAT_ROOM_IDS.length] ?? null)
        : 100 + i
  const createdAt = new Date(Date.now() - seed.daysAgo * DAY_MS).toISOString()
  const sender = seed.senderName
    ? {
        id: 100 + i,
        name: seed.senderName,
        username: `user${100 + i}`,
        picture: null,
        role: Role.USER,
        createdAt,
        modifiedAt: createdAt,
      }
    : null
  return {
    id: SEEDS.length - i,
    type: seed.type,
    message: seed.message,
    content: '',
    referenceType,
    referenceId,
    sender,
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
