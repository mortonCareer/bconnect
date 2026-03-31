import { NextResponse } from 'next/server'
import { mockChats } from '@/mocks/chat-data'

// GET /api/v1/chats/unread-count — 전체 안 읽은 메시지 수
export async function GET() {
  const count = mockChats.reduce((sum, chat) => sum + (chat.unreadCount ?? 0), 0)

  return NextResponse.json({ success: true, data: { count } })
}
