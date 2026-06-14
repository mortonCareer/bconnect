'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import Link from 'next/link'
import { getAvatarUrl } from '@bconnect/config/avatar'
import { Button, DragHandleIcon, cn } from '@bconnect/ui'
import type { OfferQueueItem } from '@/stores/offer-queue-store'
import { OfferStatusBadge } from './OfferStatusBadge'

export function OfferQueueRow({
  item,
  profileHref,
  onRequestRemove,
}: {
  item: OfferQueueItem
  profileHref: string
  onRequestRemove: (item: OfferQueueItem) => void
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
      className={cn(
        'flex items-center gap-2.5 border-b border-[#f0f0f0] pb-[11px] pt-[10px]',
        isDragging && 'opacity-60'
      )}
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

      <Link
        href={profileHref}
        scroll={false}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
      >
        <div className="size-9 shrink-0 overflow-hidden rounded-full bg-[#d9d9d9]">
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
          <p className="text-sb-14 truncate text-gray-900">{item.name}</p>
          <p className="truncate text-[11px] leading-[16.5px] text-[#a5a5a5]">
            {[item.region, item.level, item.specialty].filter(Boolean).join(' · ')}
          </p>
        </div>
      </Link>

      <Button
        size="small"
        variant={isWaiting ? 'ghost' : 'outline'}
        onClick={() => onRequestRemove(item)}
        className={cn(
          'shrink-0 bg-white font-normal',
          isWaiting
            ? 'border-[#e5e5e5] text-[#7b7b7b] hover:bg-gray-50'
            : 'border-destructive text-destructive hover:bg-destructive/10'
        )}
      >
        {isWaiting ? '삭제' : '취소'}
      </Button>
    </div>
  )
}
