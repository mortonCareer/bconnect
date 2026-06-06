/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=619-6074
 * @figma-state 키보드열림 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=619-6031
 */
'use client'

import { useParams, useRouter } from 'next/navigation'
import { ChatView } from '@bconnect/features'
import { TopBar } from '@bconnect/ui'

export default function ChatRoomPage() {
  const params = useParams<{ chatId: string }>()
  const router = useRouter()
  const chatId = Number(params.chatId)

  return (
    <ChatView
      chatId={chatId}
      profileHref={(id) => `/profile/${id}`}
      renderShell={({ title, children }) => (
        <div className="flex min-h-0 flex-1 flex-col">
          <TopBar variant="default" title={title} showAction={false} onBack={() => router.back()} />
          {children}
        </div>
      )}
    />
  )
}
