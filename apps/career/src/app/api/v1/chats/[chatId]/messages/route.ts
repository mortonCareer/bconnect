import { NextResponse } from 'next/server'
import { mockMessages, addMessage } from '@/mocks/chat-data'

// GET /api/v1/chats/:chatId/messages — 메시지 목록 (역방향 커서 페이지네이션)
export async function GET(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId: chatIdStr } = await params
  const chatId = Number(chatIdStr)
  const { searchParams } = new URL(request.url)
  const before = searchParams.get('before')
  const limit = Number(searchParams.get('limit') || '30')

  const messages = mockMessages[chatId] ?? []

  // 최신순으로 정렬 (역방향 페이지네이션)
  const sorted = [...messages].sort(
    (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  )

  let filtered = sorted
  if (before) {
    const cursorIndex = filtered.findIndex((m) => String(m.id) === before)
    if (cursorIndex !== -1) {
      filtered = filtered.slice(cursorIndex + 1)
    }
  }

  const pageItems = filtered.slice(0, limit)
  const hasMore = filtered.length > limit

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

// POST /api/v1/chats/:chatId/messages — 메시지 전송
export async function POST(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId: chatIdStr } = await params
  const chatId = Number(chatIdStr)
  const body = await request.json()
  const { content } = body as { content: string }

  // senderId=1 (mock 현재 사용자)
  const message = addMessage(chatId, 1, content)

  return NextResponse.json({ success: true, data: message })
}
