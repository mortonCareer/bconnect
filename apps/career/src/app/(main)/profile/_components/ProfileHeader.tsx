'use client'

import { useRouter } from 'next/navigation'
import type { Trade } from '@morton/api-client'
import { TRADE_LABELS } from '@/lib/trade-labels'
import { getAvatarUrl } from '@/lib/avatar'

interface ProfileHeaderProps {
  name?: string
  picture?: string
  city?: string
  headline?: string | null
  primaryTrade?: Trade
  experience?: number
  postCount?: number
  coworkerCount?: number
  recommendationCount?: number
}

export function ProfileHeader({
  name,
  picture,
  city,
  headline,
  primaryTrade,
  experience,
  postCount,
  coworkerCount,
  recommendationCount,
}: ProfileHeaderProps) {
  const router = useRouter()

  const subtitle = [
    primaryTrade ? TRADE_LABELS[primaryTrade] : null,
    experience != null ? (experience === 0 ? '신입' : `${experience}년`) : null,
    city,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {/* 상단: 아바타 + StatsRow */}
      <div className="flex items-center gap-4">
        {/* 아바타 */}
        <div className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-full bg-morton-gray-100">
          <img
            src={picture || getAvatarUrl(name ?? 'user')}
            alt={name ?? '프로필'}
            className="h-full w-full object-cover"
          />
        </div>

        {/* StatsRow — 아바타 우측 */}
        <div className="flex flex-1 justify-around">
          <StatItem label="작업물" value={postCount ?? 0} />
          <StatItem
            label="동료"
            value={coworkerCount ?? 0}
            onClick={() => router.push('/profile/coworkers')}
          />
          <StatItem
            label="추천서"
            value={recommendationCount ?? 0}
            onClick={() => router.push('/profile/recommendations')}
          />
        </div>
      </div>

      {/* 하단: 이름 + 서브텍스트 + headline */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sb-18 text-morton-gray-900">{name ?? '이름 없음'}</span>
          {subtitle && <span className="text-r-12 text-morton-gray-500">{subtitle}</span>}
        </div>
        {headline && <p className="text-r-12 text-morton-gray-900">{headline}</p>}
      </div>
    </div>
  )
}

function StatItem({
  label,
  value,
  onClick,
}: {
  label: string
  value: number
  onClick?: () => void
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper className="flex flex-col items-center gap-1" onClick={onClick}>
      <span className="text-sb-16 text-morton-gray-900">{value}</span>
      <span className="text-r-14 text-morton-gray-900">{label}</span>
    </Wrapper>
  )
}
