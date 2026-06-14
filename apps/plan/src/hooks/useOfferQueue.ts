'use client'

import { useOfferQueueStore, type OfferQueueItem } from '@/stores/offer-queue-store'
import { useScheduleTaskStore } from '@/stores/schedule-task-store'

const EMPTY: OfferQueueItem[] = []

/**
 * 섭외 대기열 소비 facade (#575). 오늘은 zustand seam, BE 연동 시 이 파일만
 * orval 생성 훅(useGetTaskOffers/useCreateOffer/useDeleteOffer/useReorderOffers)으로
 * 교체 — optimistic + invalidateQueries. 소비 컴포넌트(OfferQueue·OfferProposeButton·
 * TaskSelectBar·PanelTask) 시그니처 불변.
 *
 * 큐 ↔ 간트 통합: 큐에서 제거한 대상이 그 작업의 대표 기술자(assignee)면 schedule store 에서도
 * 배정 해제한다(간트 그리드에서 사라지도록). BE 연동 시 실제 Offer↔배정 관계로 대체.
 */
export function useOfferQueue(taskId: string | null | undefined) {
  const items = useOfferQueueStore((s) => (taskId ? (s.queues[taskId] ?? EMPTY) : EMPTY))
  const add = useOfferQueueStore((s) => s.addToQueue)
  const remove = useOfferQueueStore((s) => s.removeFromQueue)
  const reorder = useOfferQueueStore((s) => s.reorderQueue)
  const updateTask = useScheduleTaskStore((s) => s.updateTask)
  const assigneeProfileId = useScheduleTaskStore((s) =>
    taskId ? s.tasks.find((t) => t.id === taskId)?.assignee?.profileId : undefined
  )

  return {
    items,
    count: items.length,
    isPending: false,
    isQueued: (profileId: number) => items.some((q) => q.profileId === profileId),
    addToQueue: (item: OfferQueueItem) => {
      if (taskId) add(taskId, item)
    },
    removeFromQueue: (profileId: number) => {
      if (!taskId) return
      remove(taskId, profileId)
      if (assigneeProfileId === profileId) updateTask(taskId, { assignee: undefined })
    },
    reorderQueue: (activeProfileId: number, overProfileId: number) => {
      if (taskId) reorder(taskId, activeProfileId, overProfileId)
    },
  }
}
