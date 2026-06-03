/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-13555
 */
'use client'

import { Suspense } from 'react'
import { MessagesView } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

function MessagesPanel() {
  const { panelHref, closeHref, close } = usePanelNav()

  return (
    <aside
      aria-label="메시지 목록"
      className="flex h-full w-[393px] shrink-0 flex-col border-l border-gray-200 shadow-[-4px_0_40px_0_rgba(0,0,0,0.10)]"
    >
      <MessagesView
        closeHref={closeHref}
        onClose={close}
        chatHref={(chatId) => panelHref(`/messages/${chatId}`)}
      />
    </aside>
  )
}

// usePanelNav 가 useSearchParams 를 쓰므로 static prerender(/messages) 에서 Suspense 필요.
export default function MessagesPanelPage() {
  return (
    <Suspense>
      <MessagesPanel />
    </Suspense>
  )
}
