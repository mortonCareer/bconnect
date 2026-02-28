'use client'

import { useState } from 'react'
import { cn } from '@morton/ui'

interface WorkCardProps {
  image: string
  imageAlt?: string
  company: string
  duration: string
  timestamp: string
  description: string
}

export function WorkCard({
  image,
  imageAlt,
  company,
  duration,
  timestamp,
  description,
}: WorkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="flex flex-col">
      {/* 풀 와이드 이미지 — 피그마: 고정 높이 220px */}
      <div className="relative h-[220px] w-full overflow-hidden">
        <img src={image} alt={imageAlt || description} className="h-full w-full object-cover" />
      </div>

      {/* 컨텐츠 — 피그마: px-20, 이미지와 12px gap, 메타/본문 8px gap */}
      <div className="flex flex-col gap-2 px-5 pt-3">
        {/* 회사명 / 소요일 / 작성일 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-r-12 leading-[21.6px] text-morton-gray-700">{company}</span>
            {company && duration && <div className="h-[13px] w-px bg-morton-gray-300" />}
            <span className="text-r-12 leading-[21.6px] text-morton-gray-700">{duration}</span>
          </div>
          <span className="text-r-12 leading-[21.6px] text-morton-gray-700">{timestamp}</span>
        </div>

        {/* 본문 + 더보기/접기 */}
        <div
          className={cn('flex w-full', isExpanded ? 'flex-col items-end' : 'items-center gap-2')}
        >
          <p
            className={cn(
              'text-m-16 text-morton-gray-900',
              isExpanded ? 'w-full whitespace-pre-wrap' : 'min-w-0 flex-1 truncate'
            )}
          >
            {description}
          </p>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0 cursor-pointer text-r-12 leading-[25.2px] text-morton-gray-700 underline hover:text-morton-gray-900"
          >
            {isExpanded ? '접기' : '더보기'}
          </button>
        </div>
      </div>
    </div>
  )
}
