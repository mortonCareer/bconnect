'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActionDrawer, cn, MoreVerticalIcon, useExpandableText } from '@bconnect/ui'

interface WorkCardProps {
  image: string
  imageAlt?: string
  timestamp: string
  description: string
  /** owner 전용 수정 페이지 경로. 없으면 케밥에 수정 메뉴 안 그림 (viewer/plan) */
  editHref?: string
  /** owner 전용 삭제 핸들러. 없으면 케밥에 삭제 메뉴 안 그림 (viewer/plan) */
  onDelete?: () => void
}

// TODO(#556): 업체명·기간은 Task 소속인데 Feed 에 미노출 — BE Feed 확장 시 실데이터 연결.
// 업체명·소요일 둘 다 mock 이라 각각 (Mocked) 명시.
const MOCK_HEADER = '업체명(Mocked) · N일 소요(Mocked)'

export function WorkCard({
  image,
  imageAlt,
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
        <span className="text-r-12 text-gray-500">{MOCK_HEADER}</span>
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

      {image && (
        <div className="relative h-[220px] w-full overflow-hidden bg-gray-100">
          {/* TODO: 출시 전 unoptimized 제거 + next/image remotePatterns/loader 구성 (외부 업로드 대응) */}
          <Image
            src={image}
            alt={imageAlt || description}
            fill
            sizes="393px"
            unoptimized
            className="object-cover"
          />
        </div>
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
          ...(editHref ? [{ label: '수정', onSelect: () => router.push(editHref) }] : []),
          ...(onDelete ? [{ label: '삭제', destructive: true, onSelect: onDelete }] : []),
        ]}
      />
    </div>
  )
}
