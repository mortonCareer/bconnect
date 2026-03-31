'use client'

import type { Trade } from '@morton/api-client'
import { TRADE_LABELS } from '@/lib/trade-labels'

interface ProfileHeaderProps {
  name?: string
  picture?: string
  city?: string
  headline?: string | null
  primaryTrade?: Trade
  experience?: number
}

export function ProfileHeader({
  name,
  picture,
  city,
  headline,
  primaryTrade,
  experience,
}: ProfileHeaderProps) {
  const subtitle = [
    primaryTrade ? TRADE_LABELS[primaryTrade] : null,
    experience != null ? (experience === 0 ? '신입' : `${experience}년`) : null,
    city,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex items-center gap-5 px-4 py-6">
      {/* 아바타 */}
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-morton-gray-300">
        {picture ? (
          <img src={picture} alt={name ?? '프로필'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sb-24 text-morton-gray-500">
            {name?.charAt(0) ?? '?'}
          </div>
        )}
      </div>

      {/* 이름 + 직종/경력/지역 + 한줄소개 */}
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sb-20 text-morton-gray-900">{name ?? '이름 없음'}</span>
        </div>
        {subtitle && <span className="text-r-12 text-morton-gray-500">{subtitle}</span>}
        {headline && <p className="truncate text-r-14 text-morton-gray-900">{headline}</p>}
      </div>
    </div>
  )
}
