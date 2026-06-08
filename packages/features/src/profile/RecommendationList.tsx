'use client'

import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { getTradeLabel } from '@bconnect/api-client'
import type { Recommendation } from '@bconnect/api-client'
import { cn, Skeleton, useExpandableText } from '@bconnect/ui'
import { getAvatarUrl } from '@bconnect/config/avatar'

type Mode = 'received' | 'sent'

interface RecommendationListProps {
  /** 앱이 resolve 해 내려줌. undefined = 아직 로딩 중 (스켈레톤) */
  received?: Recommendation[]
  sent?: Recommendation[]
  /** owner 전용 편집 링크. 없으면 헤더 편집 링크 안 그림 */
  editHref?: string
  /** 상단 '추천서' 헤더 숨김 — 전용 페이지(TopBar 가 타이틀 보유)에서 사용 */
  hideHeader?: boolean
}

export function RecommendationList({
  received,
  sent,
  editHref,
  hideHeader,
}: RecommendationListProps) {
  const [mode, setMode] = useState<Mode>('received')

  const active = mode === 'received' ? received : sent
  const isLoading = active === undefined
  const items = active ?? []

  return (
    <section className="flex flex-col gap-3">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-sb-16 text-gray-900">추천서</h3>
          {editHref && (
            <Link href={editHref} className="cursor-pointer text-r-12 text-primary underline">
              편집
            </Link>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <ToggleButton active={mode === 'received'} onClick={() => setMode('received')}>
          받은 추천서
        </ToggleButton>
        <ToggleButton active={mode === 'sent'} onClick={() => setMode('sent')}>
          보낸 추천서
        </ToggleButton>
      </div>

      {isLoading ? (
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
        'cursor-pointer rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] leading-[21px] text-[#1B1B1B]',
        active ? 'bg-[#F5F5F5] font-semibold' : 'bg-white font-normal'
      )}
    >
      {children}
    </button>
  )
}

function RecommendationItem({ recommendation }: { recommendation: Recommendation }) {
  const { member, content, profile } = recommendation
  const { ref, expanded, showToggle, toggle } = useExpandableText([content], 'height')
  const textId = `recommendation-${recommendation.id}`
  // TODO(#473): BE가 MaskedMember.role 미제공 — 추가되면 실제 role 연결
  const role = '반장(Mocked)'
  const subtitle = [getTradeLabel(profile.primaryTrade), role].join(' · ')

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
        <div className="flex items-baseline gap-1.5">
          <span className="text-m-14 text-[#1B1B1B]">{member.name}</span>
          <span className="text-r-12 text-[#7B7B7B]">{subtitle}</span>
        </div>
        <p
          id={textId}
          ref={ref}
          className={cn(
            'whitespace-pre-wrap text-r-12 text-[#1B1B1B]',
            !expanded && 'line-clamp-2'
          )}
        >
          {content}
        </p>
        {showToggle && (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            aria-controls={textId}
            className="cursor-pointer self-start text-r-12 text-[#A5A5A5] underline"
          >
            {expanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
    </li>
  )
}
