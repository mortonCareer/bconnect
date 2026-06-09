/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1472-10215
 */
'use client'

import { Suspense } from 'react'
import { NotificationsView, PanelAside } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

function NotificationsPanel() {
  const { closeHref, close } = usePanelNav()

  return (
    <PanelAside label="알림">
      <NotificationsView closeHref={closeHref} onClose={close} />
    </PanelAside>
  )
}

// usePanelNav 가 useSearchParams 를 쓰므로 static prerender(/notifications) 에서 Suspense 필요.
export default function NotificationsPanelPage() {
  return (
    <Suspense>
      <NotificationsPanel />
    </Suspense>
  )
}
