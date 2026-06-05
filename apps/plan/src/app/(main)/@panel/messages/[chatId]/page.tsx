/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-14052
 */
'use client'

import { useParams } from 'next/navigation'
import { ChatView } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export default function ChatPanelPage() {
  const params = useParams<{ chatId: string }>()
  const chatId = Number(params.chatId)
  const { panelHref, closeHref, close } = usePanelNav()

  return (
    <aside
      aria-label="채팅방"
      className="flex h-full w-[393px] shrink-0 flex-col border-l border-gray-200 shadow-[-4px_0_40px_0_rgba(0,0,0,0.10)]"
    >
      <ChatView
        chatId={chatId}
        closeHref={closeHref}
        onClose={close}
        backHref={panelHref('/messages')}
        profileHref={(id) => panelHref(`/profile/${id}`)}
      />
    </aside>
  )
}
