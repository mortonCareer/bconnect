/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1472-11199
 */
'use client'

import { Suspense } from 'react'
import { NotificationsView } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

function NotificationsPanel() {
  const { closeHref, close } = usePanelNav()

  return (
    <aside
      aria-label="알림"
      className="flex h-full w-[393px] shrink-0 flex-col border-l border-gray-200 shadow-[-4px_0_40px_0_rgba(0,0,0,0.10)]"
    >
      <NotificationsView closeHref={closeHref} onClose={close} />
    </aside>
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
