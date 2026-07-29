import {
  getGetDirectChatMessagesMockHandler,
  getGetDirectChatsMockHandler,
  getGetGroupChatsMockHandler,
  getGetMyMemberMockHandler,
  ChatType,
  MessageType,
  Role,
  Trade,
} from '@bconnect/api-client'
import type { DirectChat, Member, MemberSummary, Message } from '@bconnect/api-client'

// 채팅 도메인 BE 미구현 → orval faker 가 매 호출 무seed 랜덤이라 메시지·상대·본인이
// 호출마다 바뀌어 isMine/sender/헤더가 incoherent. 고정 일관 데이터셋으로 override.
// getMyMember 도 ME 로 고정(isMine 판정 기준) — @bconnect/mocks 공유라 career 식별자도
// 함께 고정되나 dev/preview 전용(prod tree-shake). DM 만 시드(그룹은 빈 목록, #759).
// 상대 프로필은 profiles.ts 가 담당. BE 확정 시 generated handler 로 교체.

const EPOCH = '2025-01-02T00:00:00.000Z'
const at = (hhmm: string) => `2025-12-04T${hhmm}:00.000Z`
const MY_ID = 1

const ME: Member = {
  id: MY_ID,
  username: 'morton_boss',
  name: '김대표',
  phone: '+821012341234',
  picture: null,
  roles: [Role.CAREER],
  createdAt: EPOCH,
  modifiedAt: EPOCH,
}

interface Worker {
  id: number
  name: string
  trade: Trade
}

const WORKERS: Worker[] = [
  { id: 101, name: '이송목', trade: Trade.WALLPAPER },
  { id: 102, name: '박전기', trade: Trade.ELECTRICAL },
  { id: 103, name: '최타일', trade: Trade.TILING },
]

const maskedOf = (w: Worker): MemberSummary => ({
  id: w.id,
  username: `worker_${w.id}`,
  name: w.name,
  picture: null,
})

const msg = (
  id: number,
  chatId: number,
  memberId: number,
  content: string,
  hhmm: string,
  type: MessageType = MessageType.TEXT
): Message => ({
  id,
  chatId,
  chatType: ChatType.DIRECT,
  memberId,
  type,
  content,
  createdAt: at(hhmm),
  modifiedAt: at(hhmm),
  attachments: [],
})

/** 섭외 제안 메시지 — BE 계약대로 content 는 offerId 문자열 (#972). tasks.ts 시드의 offerId 와 맞춘다. */
const offerMsg = (id: number, chatId: number, memberId: number, offerId: number, hhmm: string) =>
  msg(id, chatId, memberId, String(offerId), hhmm, MessageType.OFFER)

// 시간순(오래된→최신) 작성. 응답은 서버 계약대로 newest-first 로 reverse.
const MESSAGES_BY_CHAT: Record<number, Message[]> = {
  1: [
    msg(1001, 1, 101, '안녕하세요. 궁금한 점이 있어 연락드립니다.', '05:00'),
    msg(1002, 1, MY_ID, '네 안녕하세요.', '05:05'),
    msg(1003, 1, 101, '도배 작업 일정 협의 가능할까요?', '05:09'),
    msg(1004, 1, MY_ID, '다음 주 화요일부터 가능합니다.', '05:13'),
    offerMsg(1005, 1, 101, 8004, '05:20'),
  ],
  2: [
    msg(2001, 2, 102, '전기 배선 견적 문의드립니다.', '03:00'),
    msg(2002, 2, MY_ID, '도면 보내주시면 확인하겠습니다.', '03:10'),
  ],
  3: [
    msg(3001, 3, MY_ID, '타일 시공 가능하신가요?', '01:00'),
    msg(3002, 3, 103, '네 가능합니다. 일정 알려주세요.', '01:20'),
  ],
}

const UNREAD_BY_CHAT: Record<number, number> = { 1: 2, 2: 4, 3: 1 }

const chatOf = (w: Worker, index: number): DirectChat => {
  const id = index + 1
  const messages = MESSAGES_BY_CHAT[id]
  const last = messages[messages.length - 1]
  return {
    id,
    member: maskedOf(w),
    lastMessage: last,
    unreadCount: UNREAD_BY_CHAT[id] ?? 0,
    createdAt: messages[0].createdAt,
    modifiedAt: last.createdAt,
  }
}

const CHATS: DirectChat[] = WORKERS.map(chatOf)

const paramId = (value: string | readonly string[] | undefined): number =>
  Number(typeof value === 'string' ? value : (value?.[0] ?? ''))

export const chatsOverrides = [
  getGetMyMemberMockHandler(() => ME),
  getGetDirectChatsMockHandler(() => CHATS),
  getGetGroupChatsMockHandler(() => []),
  getGetDirectChatMessagesMockHandler(({ params }) => {
    const id = paramId(params.id)
    const content = (MESSAGES_BY_CHAT[id] ?? []).slice().reverse()
    return { content, hasNext: false }
  }),
]
