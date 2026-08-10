'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ActionDrawer,
  cn,
  EditIcon,
  ImageCarousel,
  MoreVerticalIcon,
  TrashIcon,
  useExpandableText,
} from '@bconnect/ui'

interface WorkCardProps {
  images: string[]
  imageAlt?: string
  /** 작업물이 붙은 작업(task)의 업체명. 작업 미연결 게시물이면 생략 */
  company?: string
  /** 시공기간 (예: '4일 소요'). 작업 미연결 게시물이면 생략 */
  duration?: string
  timestamp: string
  description: string
  /** owner 전용 수정 페이지 경로. 없으면 케밥에 수정 메뉴 안 그림 (viewer/plan) */
  editHref?: string
  /** owner 전용 삭제 핸들러. 없으면 케밥에 삭제 메뉴 안 그림 (viewer/plan) */
  onDelete?: () => void
}

export function WorkCard({
  images,
  imageAlt,
  company,
  duration,
  timestamp,
  description,
  editHref,
  onDelete,
}: WorkCardProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const { ref, expanded, showToggle, toggle } = useExpandableText([description], 'width')

  const canManage = !!editHref || !!onDelete

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {company && <span className="truncate text-r-12 text-gray-500">{company}</span>}
          {company && duration && <div className="h-[13px] w-px shrink-0 bg-gray-300" />}
          {duration && <span className="shrink-0 text-r-12 text-gray-500">{duration}</span>}
        </div>
        <div className="flex items-center gap-2">
          {timestamp && <span className="text-r-12 text-gray-500">{timestamp}</span>}
          {canManage && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="작업물 메뉴"
              className="flex h-6 w-6 cursor-pointer items-center justify-center text-gray-500"
            >
              <MoreVerticalIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <ImageCarousel
          images={images}
          alt={imageAlt || description}
          imageClassName="rounded-none bg-gray-100"
        />
      )}

      <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
        <div className={cn('flex w-full', expanded ? 'flex-col items-end' : 'items-center gap-2')}>
          <p
            ref={ref}
            className={cn(
              'text-m-16 text-gray-900',
              expanded ? 'w-full whitespace-pre-wrap' : 'min-w-0 flex-1 truncate'
            )}
          >
            {description}
          </p>
          {showToggle && (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={expanded}
              className="shrink-0 cursor-pointer text-r-12 leading-[25.2px] text-gray-700 underline hover:text-gray-900"
            >
              {expanded ? '접기' : '더보기'}
            </button>
          )}
        </div>
      </div>

      <ActionDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        items={[
          ...(editHref
            ? [
                {
                  label: '수정',
                  icon: <EditIcon size={18} />,
                  onSelect: () => router.push(editHref),
                },
              ]
            : []),
          ...(onDelete
            ? [
                {
                  label: '삭제',
                  icon: <TrashIcon size={18} />,
                  destructive: true,
                  onSelect: onDelete,
                },
              ]
            : []),
        ]}
      />
    </div>
  )
}
