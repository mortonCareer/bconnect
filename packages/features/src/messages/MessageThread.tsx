'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useInfiniteQuery, getChatMessages, getGetChatMessagesQueryKey } from '@bconnect/api-client'
import type { Message, MessageCursorPage, MaskedMember } from '@bconnect/api-client'
import { ChatMessage } from '@bconnect/ui'
import { formatChatTime } from '@bconnect/config/format'

interface MessageThreadProps {
  chatId: number
  currentUserId: number | undefined
  participants: MaskedMember[]
  localMessages: Message[]
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${String(d.getDate()).padStart(2, '0')}일`
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-6">
      <span className="text-r-14 text-gray-500">{date}</span>
    </div>
  )
}

/** 발신자 이름/아바타는 Chat.participants(MaskedMember)에서 해석 — admin 전용 getMembers 미사용 */
function Bubble({
  message,
  currentUserId,
  participants,
}: {
  message: Message
  currentUserId: number | undefined
  participants: MaskedMember[]
}) {
  const isMine = message.memberId === currentUserId
  const timestamp = message.createdAt ? formatChatTime(message.createdAt) : undefined
  if (isMine) {
    return <ChatMessage variant="mine" message={message.content} timestamp={timestamp} />
  }
  const sender = participants.find((p) => p.id === message.memberId)
  return (
    <ChatMessage
      variant="theirs"
      message={message.content}
      timestamp={timestamp}
      nickname={sender?.name ?? '상대방'}
      profileImage={sender?.picture ?? undefined}
    />
  )
}

export function MessageThread({
  chatId,
  currentUserId,
  participants,
  localMessages,
}: MessageThreadProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topObserverRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number>(0)
  const isInitialLoadRef = useRef(true)
  const isNearBottomRef = useRef(true)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<MessageCursorPage>({
      queryKey: getGetChatMessagesQueryKey(chatId),
      queryFn: ({ pageParam }) =>
        getChatMessages(chatId, pageParam ? { cursor: pageParam as string } : undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
    })

  // 서버 페이지는 최신순(페이지·페이지내 모두) → 시간순으로 이중 reverse
  const serverMessages =
    data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.content.slice().reverse()) ?? []
  const allMessages = [...serverMessages, ...localMessages]
  const lastMessage = allMessages[allMessages.length - 1]
  const lastMessageId = lastMessage?.id
  const lastIsMine = lastMessage?.memberId === currentUserId

  const handleScroll = useCallback(() => {
    const c = scrollContainerRef.current
    if (!c) return
    isNearBottomRef.current = c.scrollHeight - c.scrollTop - c.clientHeight < 120
  }, [])

  useEffect(() => {
    if (!isLoading && isInitialLoadRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView()
      isInitialLoadRef.current = false
    }
  }, [isLoading])

  useEffect(() => {
    if (isInitialLoadRef.current || !bottomRef.current) return
    if (!isNearBottomRef.current && !lastIsMine) return
    bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [lastMessageId, lastIsMine])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || isFetchingNextPage) return
    if (prevScrollHeightRef.current > 0) {
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = 0
    }
  }, [data?.pages.length, isFetchingNextPage])

  const handleTopObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        const container = scrollContainerRef.current
        if (container) prevScrollHeightRef.current = container.scrollHeight
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const el = topObserverRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleTopObserver, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleTopObserver])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-m-14 text-gray-500">메시지를 불러오는 중...</p>
      </div>
    )
  }
  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-m-14 text-gray-500">메시지를 불러올 수 없습니다</p>
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex flex-1 flex-col overflow-y-auto px-4 py-3"
    >
      <div ref={topObserverRef} className="h-1 shrink-0" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <p className="text-r-12 text-gray-400">이전 메시지 불러오는 중...</p>
        </div>
      )}
      <div className="flex flex-col gap-5">
        {allMessages.map((message, index) => {
          const prev = index > 0 ? allMessages[index - 1] : null
          const currentDate = message.createdAt ? formatDateLabel(message.createdAt) : null
          const prevDate = prev?.createdAt ? formatDateLabel(prev.createdAt) : null
          const showSep = currentDate && currentDate !== prevDate
          return (
            <div key={message.id ?? `local-${message.createdAt}`}>
              {showSep && <DateSeparator date={currentDate} />}
              <Bubble message={message} currentUserId={currentUserId} participants={participants} />
            </div>
          )
        })}
      </div>
      <div ref={bottomRef} className="h-1 shrink-0" />
    </div>
  )
}
