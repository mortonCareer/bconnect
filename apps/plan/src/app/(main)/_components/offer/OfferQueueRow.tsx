'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import { getAvatarUrl } from '@bconnect/config/avatar'
import { Button, DragHandleIcon, cn } from '@bconnect/ui'
import type { OfferQueueItem } from '@/stores/offer-queue-store'
import { OfferStatusBadge } from './OfferStatusBadge'

export function OfferQueueRow({
  item,
  onRemove,
}: {
  item: OfferQueueItem
  onRemove: (profileId: number) => void
}) {
  const isWaiting = item.status === 'waiting'
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.profileId,
    disabled: !isWaiting,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('flex items-center gap-2 py-[10px]', isDragging && 'opacity-60')}
    >
      <button
        type="button"
        aria-label="순서 변경 핸들"
        className={cn(
          'flex shrink-0 touch-none items-center justify-center text-gray-300',
          isWaiting ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-40'
        )}
        {...(isWaiting ? { ...attributes, ...listeners } : {})}
      >
        <DragHandleIcon size={16} />
      </button>

      <OfferStatusBadge status={item.status} />

      <div className="size-9 shrink-0 overflow-hidden rounded-full bg-gray-50">
        <Image
          src={item.picture || getAvatarUrl(item.name)}
          alt={item.name}
          width={36}
          height={36}
          unoptimized
          className="size-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-r-14 truncate text-gray-900">{item.name}</p>
        <p className="text-r-12 truncate text-gray-500">
          {[item.region, item.level, item.specialty].filter(Boolean).join(' · ')}
        </p>
      </div>

      <Button
        variant="ghost"
        onClick={() => onRemove(item.profileId)}
        className="text-r-12 h-7 w-auto shrink-0 px-3"
      >
        {isWaiting ? '삭제' : '취소'}
      </Button>
    </div>
  )
}
