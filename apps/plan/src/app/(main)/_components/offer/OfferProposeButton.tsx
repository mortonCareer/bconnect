'use client'

import { useState } from 'react'
import { Button, ConfirmDialog, toast } from '@bconnect/ui'
import { useOfferQueue } from '@/hooks/useOfferQueue'
import type { OfferQueueItem } from '@/stores/offer-queue-store'

/**
 * 프로필 패널 '섭외 제안하기' 토글 (#575) — 선택된 작업(taskId)의 대기열에 후보를 '대기중'으로 추가.
 * 이미 추가됨이면 '섭외 취소'(destructive) — 제거는 확인 가드 경유. ProfileView actionSlot 주입.
 */
export function OfferProposeButton({
  taskId,
  candidate,
}: {
  taskId: string
  candidate: OfferQueueItem
}) {
  const { isQueued, addToQueue, removeFromQueue } = useOfferQueue(taskId)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (isQueued(candidate.profileId)) {
    return (
      <>
        <Button
          variant="outline"
          size="full"
          className="h-10 border-destructive text-destructive hover:bg-destructive/5"
          onClick={() => setConfirmOpen(true)}
        >
          섭외 취소
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="섭외를 취소할까요?"
          description="섭외 대기열에서 제거돼요."
          confirmLabel="섭외 취소"
          destructive
          onConfirm={() => {
            removeFromQueue(candidate.profileId)
            toast({ description: '섭외를 취소했어요', variant: 'success' })
            setConfirmOpen(false)
          }}
        />
      </>
    )
  }

  return (
    <Button
      variant="outline"
      size="full"
      className="h-10"
      onClick={() => {
        addToQueue(candidate)
        toast({ description: '섭외 대기열에 추가했어요', variant: 'success' })
      }}
    >
      섭외 제안하기
    </Button>
  )
}
