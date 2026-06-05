/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-14052
 */
'use client'

import { useParams } from 'next/navigation'
import { ChatView, PanelAside } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export default function ChatPanelPage() {
  const params = useParams<{ chatId: string }>()
  const chatId = Number(params.chatId)
  const { panelHref, closeHref, close } = usePanelNav()

  return (
    <PanelAside label="채팅방">
      <ChatView
        chatId={chatId}
        closeHref={closeHref}
        onClose={close}
        backHref={panelHref('/messages')}
        profileHref={(id) => panelHref(`/profile/${id}`)}
      />
    </PanelAside>
  )
}
