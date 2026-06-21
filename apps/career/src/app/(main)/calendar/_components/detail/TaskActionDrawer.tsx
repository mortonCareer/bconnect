'use client'

import { ActionDrawer, PencilIcon, ShareIcon, TrashIcon } from '@bconnect/ui'

interface TaskActionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShare: () => void
  onEdit: () => void
  onDelete: () => void
}

/** 작업 상세 케밥(⋮) → 공유/수정/삭제 액션시트 (항목별 리딩 아이콘). */
export function TaskActionDrawer({
  open,
  onOpenChange,
  onShare,
  onEdit,
  onDelete,
}: TaskActionDrawerProps) {
  return (
    <ActionDrawer
      open={open}
      onOpenChange={onOpenChange}
      items={[
        { icon: <ShareIcon size={20} />, label: '공유', onSelect: onShare },
        { icon: <PencilIcon size={20} />, label: '수정', onSelect: onEdit },
        { icon: <TrashIcon size={20} />, label: '삭제', destructive: true, onSelect: onDelete },
      ]}
    />
  )
}
