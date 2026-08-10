'use client'

import { useMemo } from 'react'
import { useGetDirectChats, useGetMyMember, useGetProfile } from '@bconnect/api-client'
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
          onSendError: imageUpload.notifySendError,
        }}
      />
    </PanelAside>
  )
}
