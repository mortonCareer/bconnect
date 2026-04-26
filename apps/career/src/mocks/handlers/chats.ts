import { http } from 'msw'
import { ok, notFound, created } from '../lib/response'
import { chats, allMessages, isoNow } from '../data/seed'
import { paginate, paginateReverse } from '../lib/pagination'

export const chatsHandlers = [
  // 채팅방 목록 (cursor pagination)
  http.get('*/api/v1/chats', ({ request }) => {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)
    return ok(paginate(chats, cursor, limit))
  }),

  // 1:1 채팅방 시작/조회 — 같은 상대와 이미 채팅 있으면 기존 반환, 없으면 신규 생성
  http.post('*/api/v1/chats/direct', async ({ request }) => {
    const body = (await request.json()) as { peerId?: number }
    const peerId = body.peerId
    if (!peerId) return notFound('대화 상대를 찾을 수 없습니다')
    const existing = chats.find(
      (c) => c.participantIds.length === 2 && c.participantIds.includes(peerId)
    )
    if (existing) return ok(existing)

    const newChat = {
      id: chats.length + 1,
      title: `1:1 with ${peerId}`,
      participantIds: [1, peerId],
      lastMessage: {
        id: (chats.length + 1) * 1000 + 1,
        chatId: chats.length + 1,
        senderId: 1,
        content: '대화를 시작해보세요',
        createdAt: isoNow,
        modifiedAt: isoNow,
      },
      unreadCount: 0,
      createdAt: isoNow,
      modifiedAt: isoNow,
    }
    chats.push(newChat)
    allMessages.set(newChat.id, [])
    return created(newChat)
  }),

  // 채팅방 메시지 목록 (reverse cursor — 과거 방향)
  http.get('*/api/v1/chats/:chatId/messages', ({ params, request }) => {
    const chatId = parseInt(params.chatId as string, 10)
    const msgs = allMessages.get(chatId) ?? []
    const url = new URL(request.url)
    const before = url.searchParams.get('before')
    const limit = parseInt(url.searchParams.get('limit') ?? '30', 10)
    return ok(paginateReverse(msgs, before, limit))
  }),

  // 채팅방 메시지 전송
  http.post('*/api/v1/chats/:chatId/messages', async ({ params, request }) => {
    const chatId = parseInt(params.chatId as string, 10)
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return notFound('채팅방을 찾을 수 없습니다')
    const body = (await request.json()) as { content?: string }
    const msgs = allMessages.get(chatId) ?? []
    const newMsg = {
      id: chatId * 1000 + msgs.length + 1,
      chatId,
      senderId: 1,
      content: body.content ?? '',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    }
    msgs.push(newMsg)
    allMessages.set(chatId, msgs)
    chat.lastMessage = newMsg
    chat.modifiedAt = newMsg.createdAt
    return created(newMsg)
  }),

  // 채팅방 단건 조회 (반드시 :chatId/messages 보다 뒤에 둘 것)
  http.get('*/api/v1/chats/:chatId', ({ params }) => {
    const id = parseInt(params.chatId as string, 10)
    const chat = chats.find((c) => c.id === id)
    if (!chat) return notFound('채팅방을 찾을 수 없습니다')
    return ok(chat)
  }),
]
