'use client'

import { useOfferQueueStore, type OfferQueueItem } from '@/stores/offer-queue-store'

const EMPTY: OfferQueueItem[] = []

/**
 * 섭외 대기열 소비 facade (#575). 오늘은 zustand seam, BE 연동 시 이 파일만
 * orval 생성 훅(useGetTaskOffers/useCreateOffer/useDeleteOffer/useReorderOffers)으로
 * 교체 — optimistic + invalidateQueries. 소비 컴포넌트(OfferQueue·OfferProposeButton·
 * TaskSelectBar·PanelTask) 시그니처 불변.
 */
export function useOfferQueue(taskId: string | null | undefined) {
  const items = useOfferQueueStore((s) => (taskId ? (s.queues[taskId] ?? EMPTY) : EMPTY))
  const add = useOfferQueueStore((s) => s.addToQueue)
  const remove = useOfferQueueStore((s) => s.removeFromQueue)
  const reorder = useOfferQueueStore((s) => s.reorderQueue)

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
