/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-14052
 */
'use client'

import { useParams } from 'next/navigation'
import { useGetChat, useGetMyMember, useGetProfile } from '@bconnect/api-client'
import { ChatView, PanelAside, type ChatViewData } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export default function ChatPanelPage() {
  const params = useParams<{ chatId: string }>()
  const chatId = Number(params.chatId)
  const { panelHref, closeHref, close } = usePanelNav()

  const enabled = Number.isFinite(chatId) && chatId > 0
  const currentUserId = useGetMyMember().data?.id
  const { data: chat, isLoading, isError } = useGetChat(chatId, { query: { enabled } })
  const otherId = chat?.participants.find((p) => p.id !== currentUserId)?.id
  const { data: otherProfile } = useGetProfile(otherId ?? 0, {
    query: { enabled: otherId != null },
  })

  const data: ChatViewData = {
    chat,
    currentUserId,
    otherProfile: otherProfile?.profile,
    isLoading,
    isError,
  }

  return (
    <PanelAside label="채팅방">
      <ChatView
        chatId={chatId}
        data={data}
        closeHref={closeHref}
        onClose={close}
        backHref={panelHref('/messages')}
        profileHref={(id) => panelHref(`/profile/${id}`)}
      />
    </PanelAside>
  )
}
