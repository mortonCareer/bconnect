'use client'

import { useState } from 'react'
import { CoworkerStatus } from '@bconnect/api-client'
import type { CoworkerStatus as CoworkerStatusValue } from '@bconnect/api-client'
import {
  ActionDrawer,
  CheckIcon,
  ConfirmDialog,
  MessageIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from '@bconnect/ui'
import type { ActionDrawerItem } from '@bconnect/ui'

export interface CoworkerManageDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * 대상과 나의 동료 관계 상태 — 표시할 액션을 결정한다.
   * 대상 미선택(드로어 닫힘) 상태를 허용하기 위해 optional. 없으면 메시지 보내기만 노출.
   */
  status?: CoworkerStatusValue
  /** 확인 다이얼로그 카피에 쓸 대상 이름 */
  memberName?: string
  /** 동료 요청 보내기 (status=NONE) */
  onAdd?: () => void
  /** 보낸 동료 요청 취소 (status=SENT) */
  onCancelRequest?: () => void
  /** 받은 동료 요청 수락 (status=RECEIVED) */
  onAccept?: () => void
  /** 받은 동료 요청 거절 (status=RECEIVED) */
  onDeny?: () => void
  /** 동료 삭제 (status=COWORKER) */
  onDelete?: () => void
  /** 메시지 보내기 (전 상태 공통) */
  onMessage?: () => void
  /** mutation 진행 중 — 항목 비활성 (중복 클릭 방지) */
  pending?: boolean
}

/**
 * 동료 관계 관리 하단 드로어 — 상태 액션 + 메시지 보내기 두 행으로 구성한다.
 * 1행은 CoworkerStatus 로 파생, 2행은 전 상태 공통 '메시지 보내기'.
 * - NONE     → 동료 추가 · 메시지
 * - SENT     → 동료 요청 취소 · 메시지
 * - RECEIVED → 수락 · 거절 · 메시지
 * - COWORKER → 동료 삭제(destructive → ConfirmDialog) · 메시지
 *
 * 삭제만 확인 다이얼로그로 가드(동료 관계 해제). 수락/거절/취소/추가는
 * 기존 CoworkerRequestList 와 동일하게 즉시 실행한다.
 *
 * presentational — open 상태·mutation·토스트는 호출부(앱)가 소유.
 * career 동료 목록 행의 ⋮ 메뉴가 사용 (#870).
 */
export function CoworkerManageDrawer({
  open,
  onOpenChange,
  status,
  memberName,
  onAdd,
  onCancelRequest,
  onAccept,
  onDeny,
  onDelete,
  onMessage,
  pending = false,
}: CoworkerManageDrawerProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  // 메시지 보내기 — 전 상태 공통 항목
  const messageItem: ActionDrawerItem = {
    label: '메시지 보내기',
    icon: <MessageIcon size={18} />,
    disabled: pending,
    onSelect: () => onMessage?.(),
  }

  const items: ActionDrawerItem[] = (() => {
    switch (status) {
      case CoworkerStatus.NONE:
        return [
          {
            label: '동료 추가',
            icon: <PlusIcon size={18} />,
            disabled: pending,
            onSelect: () => onAdd?.(),
          },
          messageItem,
        ]
      case CoworkerStatus.SENT:
        return [
          {
            label: '동료 요청 취소',
            icon: <XIcon size={18} />,
            disabled: pending,
            onSelect: () => onCancelRequest?.(),
          },
          messageItem,
        ]
      case CoworkerStatus.RECEIVED:
        return [
          {
            label: '동료 요청 수락',
            icon: <CheckIcon size={18} />,
            disabled: pending,
            onSelect: () => onAccept?.(),
          },
          {
            label: '동료 요청 거절',
            icon: <XIcon size={18} />,
            disabled: pending,
            onSelect: () => onDeny?.(),
          },
          messageItem,
        ]
      case CoworkerStatus.COWORKER:
        return [
          {
            label: '동료 삭제',
            icon: <TrashIcon size={18} />,
            destructive: true,
            disabled: pending,
            // ActionDrawer 는 먼저 닫힌 뒤 onSelect 를 호출 → 드로어가 사라진 후 확인 다이얼로그 오픈
            onSelect: () => setConfirmOpen(true),
          },
          messageItem,
        ]
      default:
        return [messageItem]
    }
  })()

  return (
    <>
      <ActionDrawer open={open} onOpenChange={onOpenChange} items={items} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="동료를 삭제할까요?"
        description={
          memberName ? `${memberName}님과의 동료 관계가 해제됩니다.` : '동료 관계가 해제됩니다.'
        }
        confirmLabel="동료 삭제"
        destructive
        onConfirm={() => onDelete?.()}
      />
    </>
  )
}
