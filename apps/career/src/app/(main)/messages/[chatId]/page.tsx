/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=619-6074
 * @figma-state 키보드열림 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=619-6031
 */
'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  useGetChat,
  useGetMyMember,
  useGetProfile,
  MessageType,
  TRADE_LABELS,
} from '@bconnect/api-client'
import type { Message } from '@bconnect/api-client'
import { TopBar, ChatInput, ChatListItem } from '@bconnect/ui'
import MessageList from './_components/MessageList'

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = Number(params.chatId)
  const currentUserId = useGetMyMember().data?.id

  const { data: chat } = useGetChat(chatId, {
    query: { enabled: !!chatId },
  })

  const otherMember = chat?.participants?.find((p) => p.id !== currentUserId)
  const otherMemberId = otherMember?.id
  const { data: otherProfile } = useGetProfile(otherMemberId ?? 0, {
    query: { enabled: otherMemberId != null },
  })

  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')

  const handleSend = useCallback(() => {
    if (currentUserId == null) return // 인증 없이 전송 불가
    const content = message.trim()
    if (!content) return
    const newMessage: Message = {
      id: Date.now(),
      chatId,
      memberId: currentUserId,
      type: MessageType.TEXT,
      content,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    }
    setLocalMessages((prev) => [...prev, newMessage])
    setMessage('')
  }, [chatId, currentUserId, message])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        variant="default"
        title={otherMember?.name ?? chat?.title ?? '채팅'}
        showAction={false}
        onBack={() => router.back()}
      />

      {otherMember && (
        <Link href={`/profile/${otherMember.id}`} className="block shrink-0">
          <ChatListItem
            profileImage={otherMember.picture ?? undefined}
            name={otherMember.name}
            specialty={
              otherProfile?.profile.primaryTrade
                ? TRADE_LABELS[otherProfile.profile.primaryTrade]
                : undefined
            }
            lastMessage={otherProfile?.profile.about ?? undefined}
          />
        </Link>
      )}

      <MessageList chatId={chatId} localMessages={localMessages} />

      <ChatInput value={message} onChange={setMessage} onSend={handleSend} />
    </div>
  )
}
