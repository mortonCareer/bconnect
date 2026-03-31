'use client'

import { useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  useGetChat,
  useSendMessage,
  useMarkChatAsRead,
  useQueryClient,
  getGetChatMessagesQueryKey,
} from '@morton/api-client'
import { TopBar } from '@morton/ui'
import MessageList from './_components/MessageList'
import ChatInput from './_components/ChatInput'

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = Number(params.chatId)
  const queryClient = useQueryClient()

  const { data: chat } = useGetChat(chatId, {
    query: { enabled: !!chatId },
  })

  // 읽음 처리 — 채팅방 진입 시
  const { mutate: markAsRead } = useMarkChatAsRead()
  useEffect(() => {
    if (chatId) markAsRead({ chatId })
  }, [chatId, markAsRead])

  const { mutate: sendMessageMutate, isPending } = useSendMessage()

  const handleSend = useCallback(
    (content: string) => {
      sendMessageMutate(
        { chatId, data: { content } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetChatMessagesQueryKey(chatId) })
          },
        }
      )
    },
    [chatId, sendMessageMutate, queryClient]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        variant="default"
        title={chat?.title ?? '채팅'}
        showAction={false}
        onBack={() => router.back()}
      />

      <MessageList chatId={chatId} />

      <ChatInput onSend={handleSend} disabled={isPending} />
    </div>
  )
}
