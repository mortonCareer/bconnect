'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGetChat, useGetMyMember, MessageType } from '@bconnect/api-client'
import type { Message } from '@bconnect/api-client'
import { ChatInput, Skeleton } from '@bconnect/ui'
import { PanelHeader } from '../_shared/PanelHeader'
import { MessageThread } from './MessageThread'

export interface ChatViewProps {
  chatId: number
  closeHref: string
  onClose: () => void
  /** 목록 패널 href — 헤더 뒤로가기 */
  backHref: string
}

export function ChatView({ chatId, closeHref, onClose, backHref }: ChatViewProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const enabled = Number.isFinite(chatId) && chatId > 0
  const currentUserId = useGetMyMember().data?.id
  const { data: chat, isLoading, isError } = useGetChat(chatId, { query: { enabled } })
  const participants = chat?.participants ?? []
  const other = participants.find((p) => p.id !== currentUserId)
  const title = other?.name ?? chat?.title ?? '채팅'

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

  return (
    <div ref={rootRef} tabIndex={-1} className="flex h-full flex-col bg-white outline-none">
      <PanelHeader
        title={title}
        backHref={backHref}
        backLabel="메시지 목록"
        closeLabel="메시지 패널 닫기"
        closeHref={closeHref}
      />
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
          <MessageThread
            chatId={chatId}
            currentUserId={currentUserId}
            participants={participants}
            localMessages={localMessages}
          />
          <ChatInput value={message} onChange={setMessage} onSend={handleSend} />
        </>
      )}
    </div>
  )
}
