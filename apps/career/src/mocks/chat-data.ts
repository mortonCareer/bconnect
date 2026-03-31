import type { Chat, Message } from '@morton/api-client'

// 시연용 mock 사용자 ID (로그인된 사용자)
export const MOCK_CURRENT_USER_ID = 1

// 참여자 표시 정보 (멤버+프로필 대체)
export const mockParticipants: Record<
  number,
  {
    name: string
    location: string
    jobType: string
    specialty: string
    about: string
    profileImage: string
  }
> = {
  2: {
    name: '김현장',
    location: '서울',
    jobType: '기공',
    specialty: '배관',
    about: '안녕하세요, 배관 기공 김현장입니다.',
    profileImage: 'https://api.dicebear.com/9.x/notionists/svg?seed=2',
  },
  3: {
    name: '박소장',
    location: '경기',
    jobType: '반장',
    specialty: '전기',
    about: '전기 반장 박소장입니다. 20년 경력.',
    profileImage: 'https://api.dicebear.com/9.x/notionists/svg?seed=3',
  },
  4: {
    name: '이기사',
    location: '서울',
    jobType: '준기공',
    specialty: '설비',
    about: '설비 준기공 이기사입니다.',
    profileImage: 'https://api.dicebear.com/9.x/notionists/svg?seed=4',
  },
}

// 채팅방 목록
export const mockChats: Chat[] = [
  {
    id: 1,
    title: '김현장',
    participantIds: [1, 2],
    lastMessage: {
      id: 105,
      chatId: 1,
      senderId: 2,
      content: '내일 오전 9시에 현장 와주세요',
      createdAt: '2026-03-30T05:30:00Z',
      modifiedAt: '2026-03-30T05:30:00Z',
    },
    unreadCount: 2,
    createdAt: '2026-03-28T01:00:00Z',
    modifiedAt: '2026-03-30T05:30:00Z',
  },
  {
    id: 2,
    title: '박소장',
    participantIds: [1, 3],
    lastMessage: {
      id: 205,
      chatId: 2,
      senderId: 1,
      content: '견적서 보내드렸습니다',
      createdAt: '2026-03-29T08:15:00Z',
      modifiedAt: '2026-03-29T08:15:00Z',
    },
    unreadCount: 0,
    createdAt: '2026-03-25T03:00:00Z',
    modifiedAt: '2026-03-29T08:15:00Z',
  },
  {
    id: 3,
    title: '이기사',
    participantIds: [1, 4],
    lastMessage: {
      id: 301,
      chatId: 3,
      senderId: 4,
      content: '자격증 사진 첨부했습니다',
      createdAt: '2026-03-28T06:00:00Z',
      modifiedAt: '2026-03-28T06:00:00Z',
    },
    unreadCount: 1,
    createdAt: '2026-03-20T00:00:00Z',
    modifiedAt: '2026-03-28T06:00:00Z',
  },
]

// 채팅방별 메시지 — 시간을 과거로 설정 (현재보다 항상 이전)
export const mockMessages: Record<number, Message[]> = {
  1: [
    {
      id: 101,
      chatId: 1,
      senderId: 1,
      content: '안녕하세요, 배관 작업 가능하신가요?',
      createdAt: '2026-03-29T01:00:00Z',
      modifiedAt: '2026-03-29T01:00:00Z',
    },
    {
      id: 102,
      chatId: 1,
      senderId: 2,
      content: '네, 가능합니다. 어떤 현장인가요?',
      createdAt: '2026-03-29T01:30:00Z',
      modifiedAt: '2026-03-29T01:30:00Z',
    },
    {
      id: 103,
      chatId: 1,
      senderId: 1,
      content: '강남구 역삼동 오피스텔 신축 현장입니다',
      createdAt: '2026-03-29T02:00:00Z',
      modifiedAt: '2026-03-29T02:00:00Z',
    },
    {
      id: 104,
      chatId: 1,
      senderId: 2,
      content:
        '좋습니다. 3월 31일 오전 9시에 강남구 역삼동 현장으로 와주세요. 1층 로비에서 만나서 2층 배관 작업 위치 안내해드리겠습니다. 안전모 꼭 지참해주시고 주차는 건물 뒤편 공터에 가능합니다.',
      createdAt: '2026-03-30T04:00:00Z',
      modifiedAt: '2026-03-30T04:00:00Z',
    },
    {
      id: 105,
      chatId: 1,
      senderId: 2,
      content: '내일 오전 9시에 현장 와주세요',
      createdAt: '2026-03-30T05:30:00Z',
      modifiedAt: '2026-03-30T05:30:00Z',
    },
  ],
  2: [
    {
      id: 201,
      chatId: 2,
      senderId: 3,
      content: '도면 검토 부탁드립니다',
      createdAt: '2026-03-28T02:00:00Z',
      modifiedAt: '2026-03-28T02:00:00Z',
    },
    {
      id: 202,
      chatId: 2,
      senderId: 1,
      content: '네 확인했습니다. 2층 배관 경로가 좀 복잡하네요',
      createdAt: '2026-03-28T03:00:00Z',
      modifiedAt: '2026-03-28T03:00:00Z',
    },
    {
      id: 203,
      chatId: 2,
      senderId: 3,
      content: '대안 있으시면 말씀해주세요',
      createdAt: '2026-03-29T01:00:00Z',
      modifiedAt: '2026-03-29T01:00:00Z',
    },
    {
      id: 204,
      chatId: 2,
      senderId: 1,
      content: '수정 도면 올렸습니다',
      createdAt: '2026-03-29T06:00:00Z',
      modifiedAt: '2026-03-29T06:00:00Z',
    },
    {
      id: 205,
      chatId: 2,
      senderId: 1,
      content: '견적서 보내드렸습니다',
      createdAt: '2026-03-29T08:15:00Z',
      modifiedAt: '2026-03-29T08:15:00Z',
    },
  ],
  3: [
    {
      id: 301,
      chatId: 3,
      senderId: 4,
      content: '자격증 사진 첨부했습니다',
      createdAt: '2026-03-28T06:00:00Z',
      modifiedAt: '2026-03-28T06:00:00Z',
    },
  ],
}

// 메시지 ID 카운터 (새 메시지 생성용)
let nextMessageId = 1000

export function addMessage(chatId: number, senderId: number, content: string): Message {
  const message: Message = {
    id: nextMessageId++,
    chatId,
    senderId,
    content,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  }

  if (!mockMessages[chatId]) {
    mockMessages[chatId] = []
  }
  mockMessages[chatId].push(message)

  // 채팅방의 lastMessage 업데이트
  const chat = mockChats.find((c) => c.id === chatId)
  if (chat) {
    chat.lastMessage = message
    chat.modifiedAt = message.createdAt
  }

  return message
}
