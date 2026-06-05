/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-13555
 */
'use client'

import { Suspense } from 'react'
import { MessagesView, PanelAside } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

function MessagesPanel() {
  const { panelHref, closeHref, close } = usePanelNav()

  return (
    <PanelAside label="메시지 목록">
      <MessagesView
        closeHref={closeHref}
        onClose={close}
        chatHref={(chatId) => panelHref(`/messages/${chatId}`)}
      />
    </PanelAside>
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
