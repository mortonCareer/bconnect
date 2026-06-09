'use client'

import { NotificationsView, PanelAside } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export function PanelNotifications() {
  const { closeHref, close } = usePanelNav()

  return (
    <PanelAside label="알림">
      <NotificationsView closeHref={closeHref} onClose={close} />
    </PanelAside>
  )
}
