'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageType,
  OfferStatus,
  useAcceptOffer,
  useDenyOffer,
  useInfiniteQuery,
  useQueries,
  useQueryClient,
  useGetDirectChats,
  useGetGroupChats,
  useGetMyMember,
  useGetProfile,
  useGetTasks,
  getDirectChatMessages,
  getGetDirectChatMessagesQueryKey,
  getGetOfferQueryOptions,
  getGetProfileQueryOptions,
  getGetTasksQueryKey,
} from '@bconnect/api-client'
import type { CursorPageMessage, InfiniteData, Profile } from '@bconnect/api-client'
import {
  MessagesView,
  ChatView,
  toChatSummaries,
  useChatImageUpload,
  type MessagesViewData,
  type ChatViewData,
  type OfferMessageDetail,
} from '@bconnect/features'
import { isApiErrorShape, toast } from '@bconnect/ui'
import { careerShell } from '@/app/(main)/_adapters/careerShell'

function offerActionErrorMessage(error: unknown, fallback: string): string {
  return isApiErrorShape(error) ? error.message : fallback
}

/** 메시지 목록 (/messages) — My 훅 + 병렬 Profile 보강을 resolve 해 MessagesView 로 내려준다. */
export function CareerMessagesList() {
  const router = useRouter()
  const { data: me, isLoading: isMeLoading } = useGetMyMember()
  const currentUserId = me?.id
  // 내 채팅 = DM + 그룹 병합 (통합 목록 엔드포인트 부재 → FE 병합, #759)
  const dm = useGetDirectChats()
  const group = useGetGroupChats()
  const allChats = useMemo(() => toChatSummaries(dm.data, group.data), [dm.data, group.data])

  // 상대방 member id 모음 — members 에서 본인 제외
  const otherMemberIds = useMemo(() => {
    const ids = new Set<number>()
    for (const chat of allChats) {
      const other = chat.members.find((p) => p.id !== currentUserId)
      if (other?.id != null) ids.add(other.id)
    }
    return [...ids]
  }, [allChats, currentUserId])

  // 병렬 Profile 조회 — chat 응답에 없는 풍부 정보(address, primaryTrade) 보강
  const profileQueries = useQueries({
    queries: otherMemberIds.map((id) => ({
      ...getGetProfileQueryOptions(id),
      enabled: otherMemberIds.length > 0,
    })),
  })

  const profileMap = useMemo(() => {
    const map = new Map<number, Profile>()
    profileQueries.forEach((q, i) => {
      if (q.data) map.set(otherMemberIds[i], q.data)
    })
    return map
  }, [profileQueries, otherMemberIds])

  const data: MessagesViewData = {
    chats: allChats,
    currentUserId,
    profileMap,
    isLoading: isMeLoading || dm.isLoading || group.isLoading,
    isError: dm.isError || group.isError,
  }

  return (
    <MessagesView
      data={data}
      chatHref={(chatId) => `/messages/${chatId}`}
      renderShell={careerShell(() => router.push('/'))}
    />
  )
}

/** 채팅방 (/messages/[chatId]) — chat·상대 Profile·본인 id 를 resolve 해 ChatView 로 내려준다. */
export function CareerChatRoom({ chatId }: { chatId: number }) {
  const router = useRouter()
  const currentUserId = useGetMyMember().data?.id
  // TODO(#760): 단건 조회 엔드포인트 부재 → DM 목록에서 filter. 그룹 단건은 #759.
  const { data: directChats, isLoading, isError } = useGetDirectChats()
  const chat = useMemo(
    () => toChatSummaries(directChats).find((c) => c.id === chatId),
    [directChats, chatId]
  )
  const otherId = chat?.members.find((p) => p.id !== currentUserId)?.id
  const { data: otherProfile } = useGetProfile(otherId ?? 0, {
    query: { enabled: otherId != null },
  })

  const [offerStatusOverrides, setOfferStatusOverrides] = useState<Map<number, OfferStatus>>(
    () => new Map()
  )
  const setOfferStatusOverride = useCallback((offerId: number, status: OfferStatus) => {
    setOfferStatusOverrides((prev) => {
      if (prev.get(offerId) === status) return prev
      const next = new Map(prev)
      next.set(offerId, status)
      return next
    })
  }, [])

  // OFFER 메시지의 offerId를 배정 작업과 연결해 카드 상세를 만든다.
  const { data: tasks, isLoading: isTasksLoading, isError: isTasksError } = useGetTasks()
  const taskOfferDetails = useMemo(() => {
    const map = new Map<number, OfferMessageDetail>()
    for (const task of tasks?.assigneeTasks ?? []) {
      const offer = task.offer
      if (offer?.id == null) continue
      map.set(offer.id, {
        offerId: offer.id,
        status: offer.status,
        start: task.start,
        end: task.end,
        address: task.address ?? undefined,
        trades: task.trades,
        requirement: task.requirement ?? undefined,
      })
    }
    return map
  }, [tasks])

  // 작업 목록에서 빠진 종료 섭외는 단건 조회로 상태만 보완한다.
  // 메시지 쿼리는 MessageThread와 캐시를 공유한다.
  const { data: messagePages } = useInfiniteQuery<
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
  const missingOfferIds = useMemo(() => {
    if (tasks == null) return []
    const ids = new Set<number>()
    for (const page of messagePages?.pages ?? [])
      for (const message of page.content ?? []) {
        if (message.type !== MessageType.OFFER) continue
        const offerId = Number(message.content)
        if (Number.isFinite(offerId) && !taskOfferDetails.has(offerId)) ids.add(offerId)
      }
    return [...ids]
  }, [tasks, messagePages, taskOfferDetails])
  const closedOfferQueries = useQueries({
    queries: missingOfferIds.map((id) => getGetOfferQueryOptions(id)),
  })

  // 단건 조회 실패는 다른 카드에 영향을 주지 않도록 전체 오류로 취급하지 않는다.
  const isOfferDetailsLoading = isTasksLoading || closedOfferQueries.some((q) => q.isLoading)
  const isOfferDetailsError = isTasksError
  const offerDetails = useMemo(() => {
    const map = new Map<number, OfferMessageDetail>()
    for (const [offerId, detail] of taskOfferDetails)
      map.set(offerId, { ...detail, status: offerStatusOverrides.get(offerId) ?? detail.status })
    for (const query of closedOfferQueries) {
      const offer = query.data
      if (offer == null || map.has(offer.id)) continue
      map.set(offer.id, {
        offerId: offer.id,
        status: offerStatusOverrides.get(offer.id) ?? offer.status,
      })
    }
    return map
  }, [taskOfferDetails, closedOfferQueries, offerStatusOverrides])

  // 무효화(수락/거절 → getTasks·getTaskOffers)는 orval mutationInvalidates 가 자동 처리 (ADR-0025)
  const accept = useAcceptOffer({
    mutation: {
      onSuccess: (_data, variables) => {
        setOfferStatusOverride(variables.id, OfferStatus.ACCEPTED)
        toast({ description: '섭외를 수락했어요', variant: 'success' })
      },
      onError: (error) =>
        toast({
          description: offerActionErrorMessage(
            error,
            '섭외를 수락하지 못했어요. 다시 시도해주세요'
          ),
          variant: 'error',
        }),
    },
  })
  const deny = useDenyOffer({
    mutation: {
      onSuccess: (_data, variables) => {
        setOfferStatusOverride(variables.id, OfferStatus.DENIED)
        toast({ description: '섭외를 거절했어요', variant: 'success' })
      },
      onError: (error) =>
        toast({
          description: offerActionErrorMessage(
            error,
            '섭외를 거절하지 못했어요. 다시 시도해주세요'
          ),
          variant: 'error',
        }),
    },
  })
  const pendingOfferId =
    (accept.isPending ? accept.variables?.id : undefined) ??
    (deny.isPending ? deny.variables?.id : undefined) ??
    null
  const pendingAction = accept.isPending ? 'accept' : deny.isPending ? 'deny' : null
  const isOfferActionPending = pendingAction != null

  const queryClient = useQueryClient()
  // 상대방이 변경한 섭외 상태는 소켓 수신 시 다시 조회한다.
  const handleOfferMessage = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() })
  }, [queryClient])

  const data: ChatViewData = {
    chat,
    currentUserId,
    otherProfile,
    offerDetails,
    isOfferDetailsLoading,
    isOfferDetailsError,
    isLoading,
    isError,
  }

  const imageUpload = useChatImageUpload(chatId)

  return (
    <ChatView
      chatId={chatId}
      data={data}
      profileHref={(id) => `/profile/${id}`}
      imageActions={{
        upload: imageUpload.upload,
        isUploading: imageUpload.isUploading,
        progress: imageUpload.progress,
        onSendError: imageUpload.notifySendError,
      }}
      onOfferMessage={handleOfferMessage}
      offerActions={{
        onAccept: (offerId) => {
          if (isOfferActionPending) return
          accept.mutate({ id: offerId })
        },
        onDeny: (offerId) => {
          if (isOfferActionPending) return
          deny.mutate({ id: offerId })
        },
        // 처리 중엔 모든 섭외 버튼을 잠그고, 해당 카드의 해당 버튼만 loading 표시한다.
        pendingOfferId,
        pendingAction,
      }}
      renderShell={careerShell(() => router.back(), { fill: true })}
    />
  )
}
