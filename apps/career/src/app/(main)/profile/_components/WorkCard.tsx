'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn, CheckCircleIcon, MoreVerticalIcon } from '@bconnect/ui'

interface WorkCardProps {
  postId?: number
  image: string
  imageAlt?: string
  company: string
  duration: string
  timestamp: string
  description: string
}

export function WorkCard({
  postId,
  image,
  imageAlt,
  company,
  duration,
  timestamp,
  description,
}: WorkCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (isExpanded) return
    const el = textRef.current
    if (!el) return
    setIsTruncated(el.scrollWidth > el.clientWidth)
  }, [isExpanded, description])

  const handleEdit = () => {
    if (postId) router.push(`/profile/edit/work/${postId}`)
  }

  return (
    <div className="flex flex-col">
      {/* 카드 헤더 — 건축주명 · 소요기간 + 날짜 + 액션 */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-r-12 text-gray-700">{company}</span>
          {company && duration && (
            <>
              <span className="text-r-12 text-gray-500">·</span>
              <span className="text-r-12 text-gray-700">{duration}</span>
            </>
          )}
          <CheckCircleIcon size={16} className="text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-r-12 text-gray-500">{timestamp}</span>
          {/* ⋮ 액션 버튼 */}
          <button
            className="flex h-6 w-6 items-center justify-center text-gray-500"
            onClick={handleEdit}
          >
            <MoreVerticalIcon size={16} />
          </button>
        </div>
      </div>

      {/* 풀 와이드 이미지 */}
      <div className="relative h-55 w-full overflow-hidden">
        <img src={image} alt={imageAlt || description} className="h-full w-full object-cover" />
      </div>

      {/* 본문 + 더보기/접기 */}
      <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
        <div
          className={cn('flex w-full', isExpanded ? 'flex-col items-end' : 'items-center gap-2')}
        >
          <p
            ref={textRef}
            className={cn(
              'text-m-16 text-gray-900',
              isExpanded ? 'w-full whitespace-pre-wrap' : 'min-w-0 flex-1 truncate'
            )}
          >
            {description}
          </p>
          {(isExpanded || isTruncated) && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="shrink-0 cursor-pointer text-r-12 leading-[25.2px] text-gray-700 underline hover:text-gray-900"
            >
              {isExpanded ? '접기' : '더보기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
