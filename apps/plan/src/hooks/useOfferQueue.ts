'use client'

import { useMemo } from 'react'
import {
  getGetProjectTasksQueryKey,
  getGetTaskOffersQueryKey,
  OfferStatus,
  useCancelOffer,
  useCreateOffer,
  useGetTaskOffers,
  useQueryClient,
  useReorderOffers,
} from '@bconnect/api-client'
import type { Offer } from '@bconnect/api-client'
import {
  toNumericTaskId,
  toOfferQueueItem,
} from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/task-adapter'
import type { OfferQueueItem } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'
import { useAllProjectTasks } from '@/hooks/useAllProjectTasks'

/**
 * 섭외 대기열 소비 facade (#575→#767) — 소비 컴포넌트 시그니처 불변, 내부만 offers API.
 * FE profileId 는 실제 memberId 축 → Offer.member.id 로 역룩업해 offerId/workerId 를 얻는다.
 * BE: 첫 offer 는 자동 ACTIVE 승격(promoteNext), reorder 는 PENDING 전체 offerIds 필수.
 */
export function useOfferQueue(taskId: string | null | undefined) {
  const queryClient = useQueryClient()
  const numId = toNumericTaskId(taskId)
  const enabled = numId != null
  const { data: offers, isLoading } = useGetTaskOffers(numId ?? 0, { query: { enabled } })
  // createOffer.due 임시 규약 = 해당 작업 시작일 (정확한 due 정책은 기획/BE 미결)
  const { tasks } = useAllProjectTasks()
  const task = taskId ? tasks.find((t) => t.id === taskId) : undefined

  const activePending = useMemo(
    () =>
      (offers ?? [])
        .filter((o) => o.status === OfferStatus.ACTIVE || o.status === OfferStatus.PENDING)
        .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0)),
    [offers]
  )
  const items = useMemo(() => activePending.map(toOfferQueueItem), [activePending])

  const invalidate = () => {
    if (numId == null) return
    void queryClient.invalidateQueries({ queryKey: getGetTaskOffersQueryKey(numId) })
    // 첫 offer 자동 ACTIVE 승격/취소가 '섭외중'·대표 기술자 파생에 반영되도록 tasks 도 갱신
    if (task?.projectId)
      void queryClient.invalidateQueries({
        queryKey: getGetProjectTasksQueryKey(Number(task.projectId)),
      })
  }

  const { mutate: createOffer, isPending: isCreating } = useCreateOffer({
    mutation: { onSettled: invalidate },
  })
  const { mutate: cancelOffer, isPending: isCanceling } = useCancelOffer({
    mutation: { onSettled: invalidate },
  })
  const { mutate: reorderOffers, isPending: isReordering } = useReorderOffers({
    mutation: {
      onError: invalidate,
      onSuccess: invalidate,
    },
  })

  const findOffer = (profileId: number) => activePending.find((o) => o.member?.id === profileId)

  return {
    items,
    count: items.length,
    isPending: isLoading || isCreating || isCanceling || isReordering,
    isQueued: (profileId: number) => items.some((q) => q.profileId === profileId),
    addToQueue: (item: OfferQueueItem) => {
      if (numId == null || !task) return
      createOffer({
        data: { taskId: numId, workerId: item.profileId, due: task.startDate },
      })
    },
    removeFromQueue: (profileId: number) => {
      const offer = findOffer(profileId)
      if (offer?.id != null) cancelOffer({ id: offer.id })
    },
    reorderQueue: (activeProfileId: number, overProfileId: number) => {
      if (numId == null || activeProfileId === overProfileId) return
      const pending = activePending.filter((o) => o.status === OfferStatus.PENDING)
      const from = pending.findIndex((o) => o.member?.id === activeProfileId)
      const to = pending.findIndex((o) => o.member?.id === overProfileId)
      if (from < 0 || to < 0) return
      const next = pending.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      const offerIds = next.flatMap((o) => o.id ?? [])
      if (offerIds.length !== pending.length) return
      // dnd 스냅백 방지 — offers 캐시를 새 순서로 낙관적 재배열, 실패 시 invalidate 복구
      const active = activePending.filter((o) => o.status === OfferStatus.ACTIVE)
      queryClient.setQueryData<Offer[]>(getGetTaskOffersQueryKey(numId), [...active, ...next])
      reorderOffers({ data: { offerIds } })
    },
  }
}
