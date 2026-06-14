'use client'

import { PanelAside, PanelScroll, PanelShell } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'
import { useSelectedTask } from '@/hooks/useSelectedTask'
import { OfferQueue } from '../offer/OfferQueue'

/**
 * 섭외 대기열 패널 (#575) — 탐색 페이지 '섭외 대기열 (N)' 칩 클릭으로 진입(`?panel=offer-queue`).
 * 선택된 작업(`?task=`)의 큐를 작업 패널과 동일한 OfferQueue 로 노출.
 */
export function PanelOfferQueue() {
  const { taskId, label, task } = useSelectedTask()
  const { close, closeHref } = usePanelNav()

  return (
    <PanelAside label="섭외 대기열">
      <PanelShell title="섭외 대기열" closeHref={closeHref} onClose={close}>
        {taskId && task ? (
          <PanelScroll>
            <div className="px-5 py-4">
              <p className="text-r-12 mb-3 text-gray-500">{label}</p>
              <OfferQueue taskId={taskId} />
            </div>
          </PanelScroll>
        ) : (
          <p className="text-r-14 px-5 py-10 text-center text-gray-500">
            작업을 먼저 선택해주세요.
          </p>
        )}
      </PanelShell>
    </PanelAside>
  )
}
