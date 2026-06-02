'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@bconnect/ui'

interface WorkCardProps {
  image: string
  imageAlt?: string
  timestamp: string
  description: string
}

export function WorkCard({ image, imageAlt, timestamp, description }: WorkCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (expanded) return
    const el = textRef.current
    if (el) setTruncated(el.scrollWidth > el.clientWidth)
  }, [expanded, description])

  return (
    <div className="flex flex-col">
      {timestamp && (
        <div className="flex justify-end px-4 py-2">
          <span className="text-r-12 text-gray-500">{timestamp}</span>
        </div>
      )}

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
            ref={textRef}
            className={cn(
              'text-m-16 text-gray-900',
              expanded ? 'w-full whitespace-pre-wrap' : 'min-w-0 flex-1 truncate'
            )}
          >
            {description}
          </p>
          {(expanded || truncated) && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="shrink-0 cursor-pointer text-r-12 leading-[25.2px] text-gray-700 underline hover:text-gray-900"
            >
              {expanded ? '접기' : '더보기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
