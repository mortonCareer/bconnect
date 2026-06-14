'use client'

import { useScheduleTaskStore } from '@/stores/schedule-task-store'
import type { OfferQueueItem } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'

const EMPTY: OfferQueueItem[] = []

/**
 * 섭외 대기열 소비 facade (#575). 큐는 schedule-task-store 의 task.offerQueue 가 SSOT
 * (대표 기술자 = 'offered' 멤버 파생이라, 취소 시 별도 동기화 없이 간트에서도 사라짐).
 * BE 연동 시 이 facade 만 orval 생성 훅으로 교체 — 소비 컴포넌트 시그니처 불변.
 */
export function useOfferQueue(taskId: string | null | undefined) {
  const items = useScheduleTaskStore((s) =>
    taskId ? (s.tasks.find((t) => t.id === taskId)?.offerQueue ?? EMPTY) : EMPTY
  )
  const add = useScheduleTaskStore((s) => s.addOffer)
  const remove = useScheduleTaskStore((s) => s.removeOffer)
  const reorder = useScheduleTaskStore((s) => s.reorderOffer)

  return {
    items,
    count: items.length,
    isPending: false,
    isQueued: (profileId: number) => items.some((q) => q.profileId === profileId),
    addToQueue: (item: OfferQueueItem) => {
      if (taskId) add(taskId, item)
    },
    removeFromQueue: (profileId: number) => {
      if (taskId) remove(taskId, profileId)
    },
    reorderQueue: (activeProfileId: number, overProfileId: number) => {
      if (taskId) reorder(taskId, activeProfileId, overProfileId)
    },
  }
}
