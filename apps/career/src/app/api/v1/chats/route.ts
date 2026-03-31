import { NextResponse } from 'next/server'
import { mockChats } from '@/mocks/chat-data'

// GET /api/v1/chats — 채팅방 목록 (커서 페이지네이션)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = Number(searchParams.get('limit') || '20')

  let items = [...mockChats].sort(
    (a, b) => new Date(b.modifiedAt!).getTime() - new Date(a.modifiedAt!).getTime()
  )

  if (cursor) {
    const cursorIndex = items.findIndex((c) => String(c.id) === cursor)
    if (cursorIndex !== -1) {
      items = items.slice(cursorIndex + 1)
    }
  }

  const pageItems = items.slice(0, limit)
  const hasMore = items.length > limit

  return NextResponse.json({
    success: true,
    data: {
      items: pageItems,
      meta: {
        hasMore,
        nextCursor: hasMore ? String(pageItems[pageItems.length - 1]?.id) : null,
      },
    },
  })
}

// POST /api/v1/chats — 채팅방 생성
export async function POST(request: Request) {
  const body = await request.json()
  const { participantIds } = body as { participantIds: number[] }

  // 기존 1:1 채팅방 찾기
  const existing = mockChats.find(
    (c) =>
      c.participantIds?.length === participantIds.length + 1 &&
      participantIds.every((id: number) => c.participantIds?.includes(id))
  )

  if (existing) {
    return NextResponse.json({ success: true, data: existing })
  }

  const newChat = {
    id: mockChats.length + 1,
    title: `새 채팅방`,
    participantIds: [1, ...participantIds],
    lastMessage: null,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  }
  mockChats.push(newChat)

  return NextResponse.json({ success: true, data: newChat })
}
