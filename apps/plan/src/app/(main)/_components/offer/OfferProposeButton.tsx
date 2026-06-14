'use client'

import { Button, toast } from '@bconnect/ui'
import { useOfferQueue } from '@/hooks/useOfferQueue'
import type { OfferQueueItem } from '@/stores/offer-queue-store'

/**
 * 프로필 패널 '섭외 제안하기' (#575) — 선택된 작업(taskId)의 대기열에 후보를 '대기중'으로 추가.
 * 추가됨이면 비활성 상태로 피드백(멤버십 조회 → 패널 재오픈에도 유지). ProfileView actionSlot 주입.
 */
export function OfferProposeButton({
  taskId,
  candidate,
}: {
  taskId: string
  candidate: OfferQueueItem
}) {
  const { isQueued, addToQueue } = useOfferQueue(taskId)

  if (isQueued(candidate.profileId)) {
    return (
      <Button variant="secondary" size="full" disabled>
        섭외 대기열에 추가됨
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="full"
      onClick={() => {
        addToQueue(candidate)
        toast({ description: '섭외 대기열에 추가했어요', variant: 'success' })
      }}
    >
      섭외 제안하기
    </Button>
  )
}
