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
  type OfferMessageEntry,
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

  const {
    data: projects,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
  } = useGetProjects()
  const projectIds = useMemo(() => (projects ?? []).map((p) => p.id), [projects])
  const taskQueries = useQueries({
    queries: projectIds.map((id) => getGetProjectTasksQueryOptions(id)),
  })

  // 조회 결과를 섭외별로 담는다 — 로딩·실패가 방 전체 공용이면 무관한 프로젝트의 작업 조회
  // 실패가 모든 카드를 오류로 뒤집고, 반대로 실패를 빼면 상세가 원래 없는 종료 섭외와 구분되지 않는다.
  const offers = useMemo(() => {
    const taskById = new Map(taskQueries.flatMap((q) => (q.data ?? []).map((t) => [t.id, t])))
    const isTasksLoading = isProjectsLoading || taskQueries.some((q) => q.isLoading)
    // 어느 프로젝트에서 못 찾았는지는 그 목록이 실패하면 알 수 없다 — 작업 미발견을 단정하지 않는다.
    const isTasksIncomplete = isProjectsError || taskQueries.some((q) => q.isError)
    const map = new Map<number, OfferMessageEntry>()
    offerIds.forEach((id, index) => {
      const query = offerQueries[index]
      if (query?.isLoading) return void map.set(id, { isLoading: true })
      if (query?.isError) return void map.set(id, { isError: true })
      const offer = query?.data
      if (offer == null) return void map.set(id, {})

      const task = taskById.get(offer.taskId)
      if (task == null) {
        if (isTasksLoading) return void map.set(id, { isLoading: true })
        if (isTasksIncomplete) return void map.set(id, { isError: true })
        // 작업 목록을 모두 정상 조회했는데 없는 건 — 상태만 채워 종료 섭외처럼 표시한다.
        return void map.set(id, { detail: { offerId: offer.id, status: offer.status } })
      }
      map.set(id, {
        detail: {
          offerId: offer.id,
          status: offer.status,
          start: task.start,
          end: task.end,
          address: task.address ?? undefined,
          trades: task.trades,
          requirement: task.requirement ?? undefined,
        },
      })
    })
    return map
  }, [offerIds, offerQueries, taskQueries, isProjectsLoading, isProjectsError])

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
    offers,
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
