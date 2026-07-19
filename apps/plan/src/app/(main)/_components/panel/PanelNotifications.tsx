'use client'

import { NotificationsView, PanelAside } from '@bconnect/features'
import type { Notification } from '@bconnect/api-client'
import { usePanelNav } from '@/hooks/usePanelNav'

export function PanelNotifications() {
  const { closeHref, close, panelHref } = usePanelNav()

  /**
   * 알림 유형(BE `referenceType`)별 plan 이동 목적지 — 채팅방 패널만 존재.
   * 나머지(프로필 완성 넛지·섭외·동료요청·계약)는 기술자(career) 대상이라 plan 목적지 없음 → 읽음 처리만.
   */
  const resolveHref = (n: Notification): string | undefined => {
    if (n.referenceType === 'CHAT_ROOM' && n.referenceId != null) {
      return panelHref(`messages/${n.referenceId}`)
    }
    return undefined
  }

  return (
    <PanelAside label="알림">
      <NotificationsView closeHref={closeHref} onClose={close} resolveHref={resolveHref} />
    </PanelAside>
  )
}
