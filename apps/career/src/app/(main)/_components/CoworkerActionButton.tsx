/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=3341-8341
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ActionDrawer,
  Button,
  ChevronIcon,
  ConfirmDialog,
  PencilIcon,
  TrashIcon,
} from '@bconnect/ui'
import { useCoworkerActions } from '@/app/(main)/profile/_adapters/useCoworkerActions'

interface CoworkerActionButtonProps {
  memberId: number
  /** 이미 성립된 동료 — 동료 ▼ 메뉴(추천서 작성·동료 취소) */
  isCoworker: boolean
  /** 동료 요청을 이미 보냄 — "요청됨" disabled */
  requested: boolean
  addPending: boolean
  onAdd: () => void
}

export function CoworkerActionButton({
  memberId,
  isCoworker,
  requested,
  addPending,
  onAdd,
}: CoworkerActionButtonProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { onDeleteCoworker, isDeletingCoworker } = useCoworkerActions()

  // 드로어 '추천서 작성'은 imperative 내비게이션 — 명명 핸들러로 분리 (no-restricted-syntax)
  const goWriteRecommendation = () => router.push(`/profile/${memberId}/recommend`)

  if (!isCoworker) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        disabled={addPending || requested}
        onClick={onAdd}
      >
        {requested ? '요청됨' : addPending ? '요청 중...' : '동료 추가'}
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 gap-1"
        disabled={isDeletingCoworker}
        onClick={() => setMenuOpen(true)}
      >
        동료
        <ChevronIcon size={16} direction="down" />
      </Button>

      <ActionDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        items={[
          {
            label: '추천서 작성',
            icon: <PencilIcon size={18} />,
            onSelect: goWriteRecommendation,
          },
          {
            label: '동료 취소',
            icon: <TrashIcon size={18} />,
            destructive: true,
            onSelect: () => setConfirmOpen(true),
          },
        ]}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="동료를 취소할까요?"
        description="동료 관계가 해제됩니다."
        confirmLabel="동료 취소"
        destructive
        onConfirm={() => onDeleteCoworker(memberId)}
      />
    </>
  )
}
