'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useGetReceivedRecommendations, useGetSentRecommendations } from '@bconnect/api-client'
import type { Recommendation } from '@bconnect/api-client'
import { cn, Skeleton } from '@bconnect/ui'
import { getAvatarUrl } from './labels'
import { useExpandableText } from './useExpandableText'

type Mode = 'received' | 'sent'

interface RecommendationListProps {
  profileId: number
}

export function RecommendationList({ profileId }: RecommendationListProps) {
  const [mode, setMode] = useState<Mode>('received')
  const enabled = Number.isFinite(profileId) && profileId > 0

  const received = useGetReceivedRecommendations({ profileId }, { query: { enabled } })
  const sent = useGetSentRecommendations(
    { profileId },
    { query: { enabled: enabled && mode === 'sent' } }
  )

  const active = mode === 'received' ? received : sent
  const items = active.data ?? []

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sb-16 text-gray-900">추천서</h3>

      <div className="flex gap-2">
        <ToggleButton active={mode === 'received'} onClick={() => setMode('received')}>
          받은 추천서
        </ToggleButton>
        <ToggleButton active={mode === 'sent'} onClick={() => setMode('sent')}>
          보낸 추천서
        </ToggleButton>
      </div>

      {active.isLoading ? (
        <ul className="flex flex-col divide-y divide-gray-200">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex gap-3 py-3">
              <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="py-3 text-r-14 text-gray-500">
          {mode === 'received' ? '받은 추천서가 없습니다' : '보낸 추천서가 없습니다'}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-200">
          {items.map((rec) => (
            <RecommendationItem key={rec.id} recommendation={rec} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'cursor-pointer rounded-md border px-3 py-2 text-r-14',
        active
          ? 'border-gray-300 bg-gray-100 text-sb-14 text-gray-900'
          : 'border-gray-300 bg-white text-gray-700'
      )}
    >
      {children}
    </button>
  )
}

function RecommendationItem({ recommendation }: { recommendation: Recommendation }) {
  const { member, content } = recommendation
  const { ref, expanded, showToggle, toggle } = useExpandableText([content], 'height')
  const textId = `recommendation-${recommendation.id}`

  return (
    <li className="flex gap-3 py-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {/* TODO: 출시 전 unoptimized 제거 + next/image remotePatterns/loader 구성 (dicebear SVG·외부 업로드 대응) */}
        <Image
          src={member.picture || getAvatarUrl(member.name)}
          alt={member.name}
          fill
          sizes="64px"
          unoptimized
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-m-14 text-gray-900">{member.name}</span>
        <p
          id={textId}
          ref={ref}
          className={cn('whitespace-pre-wrap text-r-12 text-gray-900', !expanded && 'line-clamp-2')}
        >
          {content}
        </p>
        {showToggle && (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            aria-controls={textId}
            className="cursor-pointer self-start text-r-12 text-gray-500 underline"
          >
            {expanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
    </li>
  )
}
