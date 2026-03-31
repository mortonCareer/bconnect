'use client'

import { useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useInfiniteQuery, getMyChats, getGetMyChatsQueryKey } from '@morton/api-client'
import type { ChatPage } from '@morton/api-client'
import { ChatListItem, TopBar } from '@morton/ui'
import { formatRelativeTime } from '@/lib/format-time'
import { MOCK_CURRENT_USER_ID, mockParticipants } from '@/mocks/chat-data'

export default function MessagesPage() {
  const observerRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<ChatPage>({
      queryKey: getGetMyChatsQueryKey(),
      queryFn: ({ pageParam }) =>
        getMyChats(pageParam ? { cursor: pageParam as string } : undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    })

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const el = observerRef.current
    if (!el) return

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleObserver])

  const chats = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="메시지" showAction={false} backHref="/" />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">로딩 중...</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">채팅이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {chats.map((chat) => {
            const otherId = chat.participantIds?.find((id) => id !== MOCK_CURRENT_USER_ID)
            const participant = otherId != null ? mockParticipants[otherId] : undefined

            return (
              <Link key={chat.id} href={`/messages/${chat.id}`} className="block px-4">
                <ChatListItem
                  variant="badge"
                  name={participant?.name ?? chat.title ?? '채팅'}
                  location={participant?.location}
                  jobType={participant?.jobType}
                  specialty={participant?.specialty}
                  lastMessage={chat.lastMessage?.content}
                  timestamp={chat.modifiedAt ? formatRelativeTime(chat.modifiedAt) : undefined}
                  unreadCount={chat.unreadCount}
                  profileImage={participant?.profileImage}
                />
              </Link>
            )
          })}
          <div ref={observerRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <p className="text-r-12 text-morton-gray-400">불러오는 중...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
