'use client'

import { ActionDrawer, PencilIcon, ShareIcon, TrashIcon } from '@bconnect/ui'

interface TaskActionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShare: () => void
  onEdit: () => void
  onDelete: () => void
  /** 수정 가능 여부. 제안작업(업체 작업)은 기술자가 수정 불가 → 수정 항목 제외. */
  canEdit: boolean
  /** 삭제 가능 여부. worker 본인이 만든 작업만 삭제 가능. */
  canDelete?: boolean
}

/** 작업 상세 케밥(⋮) → 공유/수정/삭제 액션시트 (항목별 리딩 아이콘). */
export function TaskActionDrawer({
  open,
  onOpenChange,
  onShare,
  onEdit,
  onDelete,
  canEdit,
  canDelete = true,
}: TaskActionDrawerProps) {
  return (
    <ActionDrawer
      open={open}
      onOpenChange={onOpenChange}
      items={[
        { icon: <ShareIcon size={20} />, label: '공유', onSelect: onShare },
        ...(canEdit ? [{ icon: <PencilIcon size={20} />, label: '수정', onSelect: onEdit }] : []),
        ...(canDelete
          ? [
              {
                icon: <TrashIcon size={20} />,
                label: '삭제',
                destructive: true,
                onSelect: onDelete,
              },
            ]
          : []),
      ]}
    />
  )
}
