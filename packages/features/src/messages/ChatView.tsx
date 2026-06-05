'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import {
  useGetChat,
  useGetMyMember,
  useGetProfile,
  MessageType,
  TRADE_LABELS,
} from '@bconnect/api-client'
import type { Message } from '@bconnect/api-client'
import { ChatInput, ChatListItem, Skeleton } from '@bconnect/ui'
import { PanelShell } from '../_shared/PanelShell'
import { MessageThread } from './MessageThread'

export interface ChatViewProps {
  chatId: number
  closeHref: string
  onClose: () => void
  /** 목록 패널 href — 헤더 뒤로가기 */
  backHref: string
  /** 상대 프로필 패널 href 빌더 — 앱이 주입 (plan: panelHref('/profile/'+id)) */
  profileHref?: (memberId: number) => string
}

export function ChatView({ chatId, closeHref, onClose, backHref, profileHref }: ChatViewProps) {
  const enabled = Number.isFinite(chatId) && chatId > 0
  const currentUserId = useGetMyMember().data?.id
  const { data: chat, isLoading, isError } = useGetChat(chatId, { query: { enabled } })
  const other = chat?.participants.find((p) => p.id !== currentUserId)
  const otherId = other?.id
  const title = other?.name ?? chat?.title ?? '채팅'
  const { data: otherProfile } = useGetProfile(otherId ?? 0, {
    query: { enabled: otherId != null },
  })
  const profile = otherProfile?.profile

  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')

  const handleSend = useCallback(() => {
    if (currentUserId == null) return
    const content = message.trim()
    if (!content) return
    // 전송 엔드포인트 부재(BE 미구현) — career 와 동일 optimistic-local echo. PR 본문 명시.
    const now = new Date().toISOString()
    const echo: Message = {
      id: Date.now(),
      chatId,
      memberId: currentUserId,
      type: MessageType.TEXT,
      content,
      createdAt: now,
      modifiedAt: now,
    }
    setLocalMessages((prev) => [...prev, echo])
    setMessage('')
  }, [chatId, currentUserId, message])

  const profilePanelHref = profileHref && otherId != null ? profileHref(otherId) : undefined
  const headerItem = (
    <ChatListItem
      variant="default"
      showChevron={profilePanelHref != null}
      profileImage={other?.picture ?? undefined}
      name={title}
      location={profile?.address?.city}
      specialty={profile?.primaryTrade ? TRADE_LABELS[profile.primaryTrade] : undefined}
      lastMessage={profile?.about ?? profile?.headline ?? undefined}
    />
  )

  return (
    <PanelShell
      title={title}
      backHref={backHref}
      backLabel="메시지 목록"
      closeLabel="메시지 패널 닫기"
      closeHref={closeHref}
      onClose={onClose}
    >
      {isLoading ? (
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="ml-auto h-12 w-1/2" />
          <Skeleton className="h-12 w-3/5" />
        </div>
      ) : isError || !chat ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center">
          <p className="text-r-14 text-gray-500">대화를 불러올 수 없습니다</p>
        </div>
      ) : (
        <>
          {profilePanelHref ? (
            <Link href={profilePanelHref} scroll={false} className="block shrink-0">
              {headerItem}
            </Link>
          ) : (
            <div className="shrink-0">{headerItem}</div>
          )}
          <MessageThread
            chatId={chatId}
            currentUserId={currentUserId}
            participants={chat.participants}
            localMessages={localMessages}
          />
          <ChatInput value={message} onChange={setMessage} onSend={handleSend} />
        </>
      )}
    </PanelShell>
  )
}
