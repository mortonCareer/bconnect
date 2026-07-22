'use client'

import { useState } from 'react'
import { Button, ConfirmDialog, toast } from '@bconnect/ui'
import { useOfferQueue } from '@/hooks/useOfferQueue'
import type { OfferQueueItem } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'

/**
 * 프로필 패널 '섭외 제안하기' 토글 (#575) — 선택된 작업(taskId)의 대기열 멤버십에 따라 분기.
 * 이미 큐에 있으면 '섭외 취소'(destructive, 확인 가드) — profileId 만으로 동작(프로필 fetch 무관).
 * 미등록이면 '섭외 제안하기' — candidate(프로필 데이터) 로드 전엔 비활성. ProfileView actionSlot 주입.
 */
export function OfferProposeButton({
  taskId,
  profileId,
  candidate,
}: {
  taskId: string
  profileId: number
  candidate?: OfferQueueItem
}) {
  const { isQueued, addToQueue, removeFromQueue } = useOfferQueue(taskId)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (isQueued(profileId)) {
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
            removeFromQueue(profileId)
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
      disabled={!candidate}
      onClick={() => {
        if (!candidate) return
        addToQueue(candidate)
        toast({ description: '섭외 대기열에 추가했어요', variant: 'success' })
      }}
    >
      섭외 제안하기
    </Button>
  )
}
