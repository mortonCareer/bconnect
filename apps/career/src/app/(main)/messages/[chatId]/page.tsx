/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=619-6074
 */
'use client'

import { useCallback, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGetChat } from '@morton/api-client'
import type { Message } from '@morton/api-client'
import { TopBar } from '@morton/ui'
import { useAuthStore } from '@/stores/auth-store'
import MessageList from './_components/MessageList'
import ChatInput from './_components/ChatInput'

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = Number(params.chatId)
  const currentUserId = useAuthStore((s) => s.member?.id)

  const { data: chat } = useGetChat(chatId, {
    query: { enabled: !!chatId },
  })

  const [localMessages, setLocalMessages] = useState<Message[]>([])

  const handleSend = useCallback(
    (content: string) => {
      const newMessage: Message = {
        id: Date.now(),
        chatId,
        senderId: currentUserId,
        content,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      }
      setLocalMessages((prev) => [...prev, newMessage])
    },
    [chatId, currentUserId]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        variant="default"
        title={chat?.title ?? '채팅'}
        showAction={false}
        onBack={() => router.back()}
      />

      <MessageList chatId={chatId} localMessages={localMessages} />

      <ChatInput onSend={handleSend} />
    </div>
  )
}
