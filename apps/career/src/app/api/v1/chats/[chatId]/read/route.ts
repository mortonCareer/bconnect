import { NextResponse } from 'next/server'
import { mockChats } from '@/mocks/chat-data'

// POST /api/v1/chats/:chatId/read — 읽음 처리
export async function POST(_request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  const chat = mockChats.find((c) => c.id === Number(chatId))

  if (chat) {
    chat.unreadCount = 0
  }

  return NextResponse.json({ success: true, data: null })
}
