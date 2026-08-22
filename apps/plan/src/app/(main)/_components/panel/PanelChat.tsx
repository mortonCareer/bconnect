'use client'

import { useCallback, useMemo } from 'react'
import {
  MessageType,
  useGetDirectChats,
  useGetMyMember,
  useGetProfile,
  useGetProjects,
  useInfiniteQuery,
  useQueries,
  useQueryClient,
  getDirectChatMessages,
  getGetDirectChatMessagesQueryKey,
  getGetOfferQueryKey,
  getGetOfferQueryOptions,
  getGetProjectTasksQueryKey,
  getGetProjectTasksQueryOptions,
  type CursorPageMessage,
  type InfiniteData,
} from '@bconnect/api-client'
import {
  ChatView,
  PanelAside,
  toChatSummaries,
  useChatImageUpload,
  type ChatViewData,
  type OfferMessageDetail,
} from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export function PanelChat({ chatId }: { chatId: number }) {
  const { panelHref, closeHref, close } = usePanelNav()

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

  // 섭외 제안(OFFER) 메시지는 content 에 offerId 만 담겨 온다 → 상세를 따로 붙여야 한다.
  // #1176 에서 CompanyTaskResponse 의 offer 가 제거돼 offerId → task 연결이 끊겼는데, 끊긴 건
  // 그 연결 하나뿐이라 섭외 단건 조회의 taskId 로 되잇는다:
  //   메시지 content(offerId) → GET /offers/{id}.taskId → 프로젝트 작업 목록에서 매칭 → 상세.
  // 상태도 task 가 아니라 offer 응답에서 직접 읽어 수락·거절·취소·만료가 그대로 반영된다.
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
  const offerIds = useMemo(() => {
    const ids = new Set<number>()
    for (const page of messagePages?.pages ?? [])
      for (const message of page.content ?? []) {
        if (message.type !== MessageType.OFFER) continue
        const offerId = Number(message.content)
        if (Number.isFinite(offerId)) ids.add(offerId)
      }
    return [...ids]
  }, [messagePages])
  const offerQueries = useQueries({
    queries: offerIds.map((id) => getGetOfferQueryOptions(id)),
  })

  const { data: projects } = useGetProjects()
  const projectIds = useMemo(() => (projects ?? []).map((p) => p.id), [projects])
  const taskQueries = useQueries({
    queries: projectIds.map((id) => getGetProjectTasksQueryOptions(id)),
  })

  const isOfferDetailsLoading =
    offerQueries.some((q) => q.isLoading) || taskQueries.some((q) => q.isLoading)
  const isOfferDetailsError =
    offerQueries.some((q) => q.isError) || taskQueries.some((q) => q.isError)
  const offerDetails = useMemo(() => {
    const taskById = new Map(taskQueries.flatMap((q) => (q.data ?? []).map((t) => [t.id, t])))
    const map = new Map<number, OfferMessageDetail>()
    for (const query of offerQueries) {
      const offer = query.data
      if (offer == null) continue
      const task = taskById.get(offer.taskId)
      map.set(offer.id, {
        offerId: offer.id,
        status: offer.status,
        start: task?.start,
        end: task?.end,
        address: task?.address ?? undefined,
        trades: task?.trades,
        requirement: task?.requirement ?? undefined,
      })
    }
    return map
  }, [offerQueries, taskQueries])

  const queryClient = useQueryClient()
  // 기술자가 채팅방에서 수락/거절해도 내(plan) 캐시엔 안 잡히는 상태 변경 — 소켓 수신을 계기로 잡는다.
  // 상태는 offer 단건이 들고 있으므로 작업 목록과 함께 무효화한다.
  const handleOfferMessage = useCallback(() => {
    for (const id of projectIds)
      void queryClient.invalidateQueries({ queryKey: getGetProjectTasksQueryKey(id) })
    for (const id of offerIds)
      void queryClient.invalidateQueries({ queryKey: getGetOfferQueryKey(id) })
  }, [queryClient, projectIds, offerIds])

  // companyName 은 주입하지 않는다 — plan(발신)은 카드 제목에 상대 기술자명을 쓰고,
  // 자기 업체명은 자기참조라 표시 대상이 아니다(OfferMessageCard 의 isMine 분기).
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
    <PanelAside label="채팅방">
      <ChatView
        chatId={chatId}
        data={data}
        closeHref={closeHref}
        onClose={close}
        backHref={panelHref('messages')}
        profileHref={(id) => panelHref(`profile/${id}`)}
        imageActions={{
          upload: imageUpload.upload,
          isUploading: imageUpload.isUploading,
          progress: imageUpload.progress,
          onSendError: imageUpload.notifySendError,
        }}
        onOfferMessage={handleOfferMessage}
      />
    </PanelAside>
  )
}
