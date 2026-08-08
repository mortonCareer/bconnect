'use client'

import { useMemo } from 'react'
import {
  useGetDirectChats,
  useGetMyCompany,
  useGetMyMember,
  useGetProfile,
  useGetProjects,
  useQueries,
  getGetProjectTasksQueryOptions,
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

  // 업체명 — plan 은 로그인 주체가 곧 그 업체라 project 별 계산 없이 내 업체명 고정값으로 넘긴다.
  const companyName = useGetMyCompany().data?.name

  const data: ChatViewData = {
    chat,
    currentUserId,
    otherProfile,
    offerDetails,
    isOfferDetailsLoading,
    isOfferDetailsError,
    companyName,
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
      />
    </PanelAside>
  )
}
