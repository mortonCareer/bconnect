'use client'

import { useCallback, useMemo } from 'react'
import {
  useGetDirectChats,
  useGetMyMember,
  useGetProfile,
  useGetProjects,
  useQueries,
  useQueryClient,
  getGetProjectTasksQueryOptions,
  getGetProjectTasksQueryKey,
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

  // 섭외 제안(OFFER) 메시지는 content 에 offerId 만 담겨 온다 → 프로젝트별 작업 목록에서 상세를 붙인다.
  // plan 은 career 의 getTasks(내 작업 전체) 같은 미scope 엔드포인트가 없어, 프로젝트 목록을 먼저 받고
  // 프로젝트별 getProjectTasks 를 병렬 조회해 offer 를 모은다.
  const { data: projects, isLoading: isProjectsLoading } = useGetProjects()
  const projectIds = useMemo(() => (projects ?? []).map((p) => p.id), [projects])
  const taskQueries = useQueries({
    queries: projectIds.map((id) => getGetProjectTasksQueryOptions(id)),
  })
  const isOfferDetailsLoading = isProjectsLoading || taskQueries.some((q) => q.isLoading)
  const isOfferDetailsError = taskQueries.some((q) => q.isError)
  const offerDetails = useMemo(() => {
    const map = new Map<number, OfferMessageDetail>()
    for (const query of taskQueries) {
      for (const task of query.data ?? []) {
        const offer = task.offer
        if (offer?.id == null) continue
        map.set(offer.id, {
          offerId: offer.id,
          status: offer.status,
          start: task.start,
          end: task.end,
          address: task.address ?? undefined,
          trades: task.trades,
          requirement: task.projectRequirement ?? undefined,
        })
      }
    }
    return map
  }, [taskQueries])

  const queryClient = useQueryClient()
  // 기술자가 채팅방에서 수락/거절해도 내(plan) 캐시엔 안 잡히는 상태 변경 — 소켓 수신을 계기로 잡는다.
  const handleOfferMessage = useCallback(() => {
    for (const id of projectIds)
      void queryClient.invalidateQueries({ queryKey: getGetProjectTasksQueryKey(id) })
  }, [queryClient, projectIds])

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
