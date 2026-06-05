import {
  getGetChatMessagesMockHandler,
  getGetChatMockHandler,
  getGetMyChatsMockHandler,
  getGetMyMemberMockHandler,
  getGetProfileMockHandler,
  MessageType,
  Role,
  Trade,
} from '@bconnect/api-client'
import type { Chat, MaskedMember, Member, Message, ProfileAndMember } from '@bconnect/api-client'

// 채팅 도메인 BE 미구현 → orval faker 가 매 호출 무seed 랜덤이라 메시지·참가자·본인이
// 호출마다 바뀌어 isMine/sender/헤더가 incoherent. 고정 일관 데이터셋으로 override.
// getMyMember 도 ME 로 고정(isMine 판정 기준) — @bconnect/mocks 공유라 career 식별자도
// 함께 고정되나 dev/preview 전용(prod tree-shake). BE 확정 시 generated handler 로 교체.

const EPOCH = '2025-01-02T00:00:00.000Z'
const at = (hhmm: string) => `2025-12-04T${hhmm}:00.000Z`

const ME: Member = {
  id: 1,
  username: 'morton_boss',
  name: '김대표',
  phone: '+821012341234',
  picture: null,
  role: Role.CONTRACTOR,
  createdAt: EPOCH,
  modifiedAt: EPOCH,
}

interface Worker {
  id: number
  name: string
  trade: Trade
  city: string
  experience: number
  headline: string
  about: string
}

const WORKERS: Worker[] = [
  {
    id: 101,
    name: '이송목',
    trade: Trade.WALLPAPER,
    city: '경기도',
    experience: 8,
    headline: '도배 준기공',
    about: '안녕하세요, 도배 준기공 이송목입니다.\n믿고 맡겨주신다면 성실히 임하겠습니다.',
  },
  {
    id: 102,
    name: '박전기',
    trade: Trade.ELECTRICAL,
    city: '서울특별시',
    experience: 12,
    headline: '전기 기공',
    about: '전기 공사 12년 경력입니다.\n현장 안전 최우선으로 작업합니다.',
  },
  {
    id: 103,
    name: '최타일',
    trade: Trade.TILING,
    city: '인천광역시',
    experience: 5,
    headline: '타일 시공',
    about: '타일·방수 전문입니다.\n견적 문의 편하게 주세요.',
  },
]

const maskedOf = (w: Worker): MaskedMember => ({
  id: w.id,
  username: `worker_${w.id}`,
  name: w.name,
  picture: null,
  createdAt: EPOCH,
  modifiedAt: EPOCH,
})

const ME_MASKED: MaskedMember = {
  id: ME.id,
  username: ME.username,
  name: ME.name,
  picture: ME.picture,
  createdAt: ME.createdAt,
  modifiedAt: ME.modifiedAt,
}

const msg = (
  id: number,
  chatId: number,
  memberId: number,
  content: string,
  hhmm: string
): Message => ({
  id,
  chatId,
  memberId,
  type: MessageType.TEXT,
  content,
  createdAt: at(hhmm),
  modifiedAt: at(hhmm),
})

// 시간순(오래된→최신) 작성. getChatMessages 응답은 서버 계약대로 newest-first 로 reverse.
const MESSAGES_BY_CHAT: Record<number, Message[]> = {
  1: [
    msg(1001, 1, 101, '안녕하세요. 궁금한 점이 있어 연락드립니다.', '05:00'),
    msg(1002, 1, ME.id, '네 안녕하세요.', '05:05'),
    msg(1003, 1, 101, '도배 작업 일정 협의 가능할까요?', '05:09'),
    msg(1004, 1, ME.id, '다음 주 화요일부터 가능합니다.', '05:13'),
  ],
  2: [
    msg(2001, 2, 102, '전기 배선 견적 문의드립니다.', '03:00'),
    msg(2002, 2, ME.id, '도면 보내주시면 확인하겠습니다.', '03:10'),
  ],
  3: [
    msg(3001, 3, ME.id, '타일 시공 가능하신가요?', '01:00'),
    msg(3002, 3, 103, '네 가능합니다. 일정 알려주세요.', '01:20'),
  ],
}

const UNREAD_BY_CHAT: Record<number, number> = { 1: 0, 2: 2, 3: 0 }

const chatOf = (w: Worker, index: number): Chat => {
  const id = index + 1
  const messages = MESSAGES_BY_CHAT[id]
  const last = messages[messages.length - 1]
  return {
    id,
    title: null,
    participants: [ME_MASKED, maskedOf(w)],
    lastMessage: last,
    unreadCount: UNREAD_BY_CHAT[id] ?? 0,
    createdAt: messages[0].createdAt,
    modifiedAt: last.createdAt,
  }
}

const CHATS: Chat[] = WORKERS.map(chatOf)

const profileOf = (w: Worker): ProfileAndMember => ({
  member: maskedOf(w),
  profile: {
    id: w.id,
    memberId: w.id,
    primaryTrade: w.trade,
    trades: [w.trade],
    experience: w.experience,
    headline: w.headline,
    about: w.about,
    address: {
      zipcode: '00000',
      city: w.city,
      state: w.city,
      street: '○○로 12',
      detail: null,
      latitude: 37.5,
      longitude: 127.0,
    },
    createdAt: EPOCH,
    modifiedAt: EPOCH,
  },
})

const PROFILES_BY_ID: Record<number, ProfileAndMember> = Object.fromEntries(
  WORKERS.map((w) => [w.id, profileOf(w)])
)

const paramId = (value: string | readonly string[] | undefined): number =>
  Number(typeof value === 'string' ? value : (value?.[0] ?? ''))

export const chatsOverrides = [
  getGetMyMemberMockHandler(() => ME),
  getGetMyChatsMockHandler(() => CHATS),
  getGetChatMockHandler(({ params }) => {
    const id = paramId(params.chatId)
    return CHATS.find((c) => c.id === id) ?? CHATS[0]
  }),
  getGetChatMessagesMockHandler(({ params }) => {
    const id = paramId(params.chatId)
    const content = (MESSAGES_BY_CHAT[id] ?? []).slice().reverse()
    return { content, nextCursor: null, hasNext: false }
  }),
  getGetProfileMockHandler(({ params }) => {
    const id = paramId(params.profileId)
    return PROFILES_BY_ID[id] ?? PROFILES_BY_ID[101]
  }),
]
