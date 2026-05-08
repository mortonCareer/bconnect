'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  useInfiniteQuery,
  getChatMessages,
  getGetChatMessagesQueryKey,
  useGetMyMember,
  useGetMembers,
} from '@bconnect/api-client'
import type { Message, MessageCursorPage } from '@bconnect/api-client'
import { ChatMessage } from '@bconnect/ui'
import { formatChatTime } from '@/lib/format-time'

interface MessageListProps {
  chatId: number
  localMessages: Message[]
}

/** 날짜 구분선 — Figma node 364:5574 */
function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-6">
      <span className="text-r-14 text-[#606870]">{date}</span>
    </div>
  )
}

/** 날짜 문자열 → "2026년 3월 29일" */
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${String(d.getDate()).padStart(2, '0')}일`
}

/** 상대방 프로필을 해석해 닉네임/프로필 이미지를 반환하는 래퍼 */
function SenderMessage({
  message,
  currentUserId,
}: {
  message: Message
  currentUserId: number | undefined
}) {
  const isMine = message.memberId === currentUserId
  const { data: members } = useGetMembers({ query: { enabled: !isMine && !!message.memberId } })
  const sender = members?.find((m) => m.id === message.memberId)

  if (isMine) {
    return (
      <ChatMessage
        variant="mine"
        message={message.content}
        timestamp={message.createdAt ? formatChatTime(message.createdAt) : undefined}
      />
    )
  }

  return (
    <ChatMessage
      variant="theirs"
      message={message.content}
      timestamp={message.createdAt ? formatChatTime(message.createdAt) : undefined}
      nickname={sender?.name ?? '상대방'}
      profileImage={sender?.picture ?? undefined}
    />
  )
}

export default function MessageList({ chatId, localMessages }: MessageListProps) {
  const currentUserId = useGetMyMember().data?.id
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topObserverRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number>(0)
  const isInitialLoadRef = useRef(true)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<MessageCursorPage>({
      queryKey: getGetChatMessagesQueryKey(chatId),
      queryFn: ({ pageParam }) =>
        getChatMessages(chatId, pageParam ? { cursor: pageParam as string } : undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
      refetchInterval: 5000,
    })

  // 서버 메시지를 시간순으로 정렬 (역방향 페이지네이션이므로 페이지를 뒤집어야 함)
  const serverMessages =
    data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.content.slice().reverse()) ?? []

  const allMessages = [...serverMessages, ...localMessages]

  // 초기 로드 시 스크롤을 맨 아래로
  useEffect(() => {
    if (!isLoading && isInitialLoadRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView()
      isInitialLoadRef.current = false
    }
  }, [isLoading])

  // 새 메시지(local 또는 polling) 추가 시 스크롤을 맨 아래로
  useEffect(() => {
    if (!isInitialLoadRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [allMessages.length])

  // 이전 메시지 로드 시 스크롤 위치 유지
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || isFetchingNextPage) return

    if (prevScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight
      container.scrollTop = newScrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = 0
    }
  }, [data?.pages.length, isFetchingNextPage])

  const handleTopObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        const container = scrollContainerRef.current
        if (container) {
          prevScrollHeightRef.current = container.scrollHeight
        }
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const el = topObserverRef.current
    if (!el) return

    const observer = new IntersectionObserver(handleTopObserver, {
      threshold: 0.1,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleTopObserver])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-m-14 text-bconnect-gray-500">메시지를 불러오는 중...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-m-14 text-bconnect-gray-500">메시지를 불러올 수 없습니다</p>
      </div>
    )
  }

  return (
    <div ref={scrollContainerRef} className="flex flex-1 flex-col overflow-y-auto px-4 py-3">
      {/* 상단 관찰 영역 - 이전 메시지 로드 트리거 */}
      <div ref={topObserverRef} className="h-1 shrink-0" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <p className="text-r-12 text-bconnect-gray-400">이전 메시지 불러오는 중...</p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {allMessages.map((message, index) => {
          const prevMessage = index > 0 ? allMessages[index - 1] : null
          const currentDate = message.createdAt ? formatDateLabel(message.createdAt) : null
          const prevDate = prevMessage?.createdAt ? formatDateLabel(prevMessage.createdAt) : null
          const showDateSeparator = currentDate && currentDate !== prevDate

          return (
            <div key={message.id ?? `local-${message.createdAt}`}>
              {showDateSeparator && <DateSeparator date={currentDate} />}
              <SenderMessage message={message} currentUserId={currentUserId} />
            </div>
          )
        })}
      </div>

      {/* 하단 스크롤 앵커 */}
      <div ref={bottomRef} className="h-1 shrink-0" />
    </div>
  )
}
