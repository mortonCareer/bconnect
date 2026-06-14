/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1572-13227
 */
'use client'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import Link from 'next/link'
import { Button, SearchIcon } from '@bconnect/ui'
import { useOfferQueue } from '@/hooks/useOfferQueue'
import { OfferQueueRow } from './OfferQueueRow'

function EmptyState({ actionHref }: { actionHref?: string }) {
  return (
    <div className="flex flex-col items-center pb-4 pt-8">
      <div className="flex size-[140px] items-center justify-center rounded-full bg-secondary">
        <SearchIcon size={72} className="text-primary" />
      </div>
      <p className="text-r-14 mt-4 text-gray-600">기술자를 탐색하고 섭외해보세요</p>
      {actionHref && (
        <Button asChild className="mt-4 w-full">
          <Link href={actionHref}>기술자 탐색</Link>
        </Button>
      )}
    </div>
  )
}

/**
 * 섭외 대기열 목록 (#575) — 탐색 칩 패널·작업 패널 공유. 헤더/패딩은 소비처가 제공.
 * 대기중 항목만 @dnd-kit 으로 정렬, 섭외중은 잠금(useSortable disabled).
 */
export function OfferQueue({
  taskId,
  emptyActionHref,
}: {
  taskId: string
  emptyActionHref?: string
}) {
  const { items, removeFromQueue, reorderQueue } = useOfferQueue(taskId)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  if (items.length === 0) return <EmptyState actionHref={emptyActionHref} />

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) reorderQueue(Number(active.id), Number(over.id))
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={items.map((i) => i.profileId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col">
            {items.map((item) => (
              <OfferQueueRow key={item.profileId} item={item} onRemove={removeFromQueue} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <p className="text-r-12 mt-2 text-gray-500">
        * 이미 섭외 요청이 발송된 경우 섭외 순서를 조정할 수 없어요
      </p>
    </div>
  )
}
