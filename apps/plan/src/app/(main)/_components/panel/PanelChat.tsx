'use client'

import { useCallback, useMemo } from 'react'
import {
  useGetDirectChats,
  useGetMyMember,
  useGetProfile,
  useGetProjects,
  useQueries,
  useQueryClient,
  getGetOfferQueryKey,
  getGetOfferQueryOptions,
  getGetProjectTasksQueryKey,
  getGetProjectTasksQueryOptions,
} from '@bconnect/api-client'
import {
  ChatView,
  PanelAside,
  toChatSummaries,
  useChatImageUpload,
  useChatOfferIds,
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

  // OFFER 메시지의 offerId로 taskId와 상태를 조회한 뒤 프로젝트 작업 상세를 연결한다.
  const offerIds = useChatOfferIds(chatId)
  const offerQueries = useQueries({
    queries: offerIds.map((id) => getGetOfferQueryOptions(id)),
  })

  const { data: projects, isError: isProjectsError } = useGetProjects()
  const projectIds = useMemo(() => (projects ?? []).map((p) => p.id), [projects])
  const taskQueries = useQueries({
    queries: projectIds.map((id) => getGetProjectTasksQueryOptions(id)),
  })

  const isOfferDetailsLoading =
    offerQueries.some((q) => q.isLoading) || taskQueries.some((q) => q.isLoading)
  // 건별 조회(섭외 단건·프로젝트별 작업) 실패는 전체 오류로 취급하지 않는다 — career 와 같은 기준.
  // 무관한 프로젝트 하나가 실패해도 모든 카드가 "불러오지 못했습니다"로 뒤집히던 문제.
  // 모든 상세가 걸려 있는 프로젝트 목록 실패만 전체 오류다.
  const isOfferDetailsError = isProjectsError
  const offerDetails = useMemo(() => {
    const taskById = new Map(taskQueries.flatMap((q) => (q.data ?? []).map((t) => [t.id, t])))
    const map = new Map<number, OfferMessageDetail>()
    for (const query of offerQueries) {
      const offer = query.data
      if (offer == null) continue
      // 작업 조회 전에는 빈 상세 대신 카드의 로딩·미존재 상태를 유지한다.
      const task = taskById.get(offer.taskId)
      if (task == null) continue
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
  }, [offerQueries, taskQueries])

  const queryClient = useQueryClient()
  // 상대방이 변경한 섭외 상태는 소켓 수신 시 다시 조회한다.
  const handleOfferMessage = useCallback(() => {
    for (const id of projectIds)
      void queryClient.invalidateQueries({ queryKey: getGetProjectTasksQueryKey(id) })
    for (const id of offerIds)
      void queryClient.invalidateQueries({ queryKey: getGetOfferQueryKey(id) })
  }, [queryClient, projectIds, offerIds])

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
