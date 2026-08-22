'use client'

import { useCallback, useMemo } from 'react'
import {
  useGetDirectChats,
  useGetMyMember,
  useGetProfile,
  useGetProjects,
  useQueryClient,
  getGetProjectTasksQueryKey,
} from '@bconnect/api-client'
import {
  ChatView,
  PanelAside,
  toChatSummaries,
  useChatImageUpload,
  type ChatViewData,
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

  // TODO(BE): plan 쪽 섭외 카드 상세 소스가 없다.
  // #1176 에서 CompanyTaskResponse 의 offer·projectRequirement 가 제거돼 기존 수집 경로(프로젝트별
  // getProjectTasks → task.offer)가 끊겼고, 대체 후보인 GET /offers/{id}(OfferResponse)는
  // status·member·profile 만 주고 작업기간·주소·공종·요청사항이 없다. GET /tasks/{id} 도 DELETE 뿐이라
  // taskId 로 되짚을 수도 없다. BE 가 상세를 실어줄 때까지 카드는 안내 문구만 보여준다.
  const { data: projects } = useGetProjects()
  const projectIds = useMemo(() => (projects ?? []).map((p) => p.id), [projects])

  const queryClient = useQueryClient()
  // 기술자가 채팅방에서 수락/거절해도 내(plan) 캐시엔 안 잡히는 상태 변경 — 소켓 수신을 계기로 잡는다.
  const handleOfferMessage = useCallback(() => {
    for (const id of projectIds)
      void queryClient.invalidateQueries({ queryKey: getGetProjectTasksQueryKey(id) })
  }, [queryClient, projectIds])

  const data: ChatViewData = {
    chat,
    currentUserId,
    otherProfile,
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
