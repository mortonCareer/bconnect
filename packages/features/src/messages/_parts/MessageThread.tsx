'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  MessageType,
  useInfiniteQuery,
  getDirectChatMessages,
  getGetDirectChatMessagesQueryKey,
} from '@bconnect/api-client'
import type {
  Message,
  CursorPageMessage,
  WithdrawableMember,
  InfiniteData,
} from '@bconnect/api-client'
import { chatMemberName } from './types'
import { ChatMessage } from '@bconnect/ui'
import { formatChatTime } from '@bconnect/config/format'
import { OfferMessageCard } from './OfferMessageCard'
import type { OfferMessageDetail } from './OfferMessageCard'
import type { OfferActions } from './types'

interface MessageThreadProps {
  chatId: number
  currentUserId: number | undefined
  participants: WithdrawableMember[]
  localMessages: Message[]
  /** 섭외 제안(OFFER) 메시지 상세 — key = offerId. 앱이 resolve (ADR-0020). */
  offerDetails?: Map<number, OfferMessageDetail>
  /** 섭외 상세 조회 중 — OFFER 숫자 노출 없이 카드 내부 loading 안내 */
  isOfferDetailsLoading?: boolean
  /** 섭외 상세 조회 실패 — 카드 내부 error 안내 */
  isOfferDetailsError?: boolean
  /** 수락/거절 액션 슬롯. 미주입이면 읽기전용 카드. */
  offerActions?: OfferActions
  /** 카드에 표시할 업체명 — 채팅 상대 이름 */
  companyName?: string
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

/** 발신자 이름/아바타는 참여자(WithdrawableMember)에서 해석 — admin 전용 getMembers 미사용 */
function Bubble({
  message,
  currentUserId,
  participants,
  offerDetails,
  isOfferDetailsLoading,
  isOfferDetailsError,
  offerActions,
  companyName,
}: {
  message: Message
  currentUserId: number | undefined
  participants: WithdrawableMember[]
  offerDetails?: Map<number, OfferMessageDetail>
  isOfferDetailsLoading?: boolean
  isOfferDetailsError?: boolean
  offerActions?: OfferActions
  companyName?: string
}) {
  const isMine = message.memberId === currentUserId

  // BE 는 섭외 제안·수락 시 content 에 offerId 만 담아 OFFER 메시지를 남긴다(ChatEventListener).
  // 숫자를 그대로 버블에 찍지 않도록 카드로 렌더한다 — 발신자와 무관하게 좌측 정렬(시스템성 카드).
  if (message.type === MessageType.OFFER) {
    const offerId = Number(message.content)
    const detail = Number.isFinite(offerId) ? offerDetails?.get(offerId) : undefined
    const isThisOfferPending = offerActions?.pendingOfferId === offerId
    const isAnyOfferPending = offerActions?.pendingOfferId != null
    // 아바타(size-10) + gap-2 만큼 들여써 다른 수신 버블과 좌측을 맞춘다.
    return (
      <div className="pl-12">
        <OfferMessageCard
          detail={detail}
          companyName={companyName}
          isDetailLoading={isOfferDetailsLoading}
          isDetailError={isOfferDetailsError}
          isActionDisabled={isAnyOfferPending}
          pendingAction={isThisOfferPending ? offerActions?.pendingAction : null}
          onAccept={offerActions && detail ? () => offerActions.onAccept(offerId) : undefined}
          onDeny={offerActions && detail ? () => offerActions.onDeny(offerId) : undefined}
        />
      </div>
    )
  }

  const timestamp = message.createdAt ? formatChatTime(message.createdAt) : undefined
  // IMAGE 는 content 가 비어 있고 첨부에 서명 URL 이 담겨 온다 (MessageSocketService).
  const images =
    message.type === MessageType.IMAGE
      ? (message.attachments ?? [])
          .filter((a) => a.url)
          .map((a) => ({ id: a.id, url: a.url, alt: a.filename }))
      : undefined

  if (isMine) {
    return (
      <ChatMessage variant="mine" message={message.content} images={images} timestamp={timestamp} />
    )
  }
  const sender = participants.find((p) => p.id === message.memberId)
  return (
    <ChatMessage
      variant="theirs"
      message={message.content}
      images={images}
      timestamp={timestamp}
      nickname={chatMemberName(sender) ?? '상대방'}
      profileImage={sender?.picture ?? undefined}
    />
  )
}

export function MessageThread({
  chatId,
  currentUserId,
  participants,
  localMessages,
  offerDetails,
  isOfferDetailsLoading,
  isOfferDetailsError,
  offerActions,
  companyName,
}: MessageThreadProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topObserverRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number>(0)
  const isInitialLoadRef = useRef(true)
  const isNearBottomRef = useRef(true)

  // TODO(#759): 지금은 direct(1:1) 메시지 고정. 그룹 지원 시 chatKind 로 direct/group 분기.
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<
      CursorPageMessage,
      Error,
      InfiniteData<CursorPageMessage>,
      readonly unknown[],
      number | undefined
    >({
      queryKey: getGetDirectChatMessagesQueryKey(chatId),
      queryFn: ({ pageParam }) => getDirectChatMessages(chatId, { cursor: pageParam }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
    })

  // 서버 페이지는 최신순(페이지·페이지내 모두) → 시간순으로 이중 reverse
  const serverMessages =
    data?.pages
      .slice()
      .reverse()
      .flatMap((page) => (page.content ?? []).slice().reverse()) ?? []
  // 소켓 수신분(localMessages)이 refetch 된 서버 페이지에 다시 나타나면 서버 쪽을 우선
  const serverIds = new Set(serverMessages.map((m) => m.id))
  const allMessages = [...serverMessages, ...localMessages.filter((m) => !serverIds.has(m.id))]
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
              <Bubble
                message={message}
                currentUserId={currentUserId}
                participants={participants}
                offerDetails={offerDetails}
                isOfferDetailsLoading={isOfferDetailsLoading}
                isOfferDetailsError={isOfferDetailsError}
                offerActions={offerActions}
                companyName={companyName}
              />
            </div>
          )
        })}
      </div>
      <div ref={bottomRef} className="h-1 shrink-0" />
    </div>
  )
}
