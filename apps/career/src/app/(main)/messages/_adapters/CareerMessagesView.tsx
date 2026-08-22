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

  // 섭외 제안(OFFER) 메시지는 content 에 offerId 만 담겨 온다 → 기술자 작업 목록에서 상세를 붙인다.
  // #1176 에서 작업 응답이 용도별로 갈리며 offer 를 물고 오는 건 assigneeTasks 뿐이다
  // (AssigneeTaskResponse.offer — workerTasks 는 본인이 등록한 작업이라 offer 가 없다).
  //
  // TODO(BE): projectCompanyName 이 사라져 업체명 소스가 없다. AssigneeTaskResponse 는 projectId 만
  // 주고, 회사명은 project → company 2-hop 이라야 닿는다. 카드는 companyName 없으면 업체명 행과
  // 문구 주어를 생략한다(OfferMessageCard).
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

  // 거절·취소·만료된 섭외는 작업 목록에서 빠진다 (BE OfferQueryService.listByWorker 가 ACTIVE·ACCEPTED
  // 만 반환하고, 거절된 작업은 배정 목록에도 없다) → 그대로 두면 카드가 '거절함' 대신 "찾을 수 없습니다"
  // 로 뒤집힌다. 목록에 없는 offerId 는 단건 조회(#1176)로 상태만 채운다 — 작업 상세는 BE 가 주지
  // 않으므로 상태 라벨만 남는다.
  //
  // 메시지는 MessageThread 와 같은 쿼리키로 읽어 캐시를 공유한다(추가 요청 없음).
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

  // 단건 조회 실패는 해당 카드만 "찾을 수 없습니다" 로 두고 전체 에러로 올리지 않는다 —
  // 플래그가 카드 전체에 걸려 상세가 멀쩡한 카드까지 에러 문구로 덮이기 때문.
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
  // 상대(업체)가 채팅방에서 섭외를 취소하는 등 내가 액션하지 않은 상태 변경은 소켓 수신을 계기로 잡는다.
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
