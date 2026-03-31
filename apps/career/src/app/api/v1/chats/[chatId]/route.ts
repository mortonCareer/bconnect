import { NextResponse } from 'next/server'
import { mockChats } from '@/mocks/chat-data'

// GET /api/v1/chats/:chatId — 채팅방 상세
export async function GET(_request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  const chat = mockChats.find((c) => c.id === Number(chatId))

  if (!chat) {
    return NextResponse.json(
      { success: false, error: { code: 'CHAT_NOT_FOUND', message: '채팅방을 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: chat })
}
