'use client'

import type { Trade, Role } from '@morton/api-client'
import { TRADE_LABELS } from '@/lib/trade-labels'
import { getRoleLabel } from '@/hooks/useFeedItems'

interface StatsRowProps {
  postCount?: number
  trades?: Trade[]
  primaryTrade?: Trade
  experience?: number
  role?: Role
}

export function StatsRow({ postCount, trades, primaryTrade, experience, role }: StatsRowProps) {
  const tradeDisplay = primaryTrade
    ? TRADE_LABELS[primaryTrade] + (trades && trades.length > 1 ? ` 외 ${trades.length - 1}` : '')
    : '-'
  const experienceDisplay =
    experience != null ? (experience === 0 ? '신입' : `${experience}년`) : '-'
  const roleDisplay = role ? getRoleLabel(role) : '-'

  return (
    <div className="flex justify-between px-4 py-3">
      <StatItem label="작업물" value={postCount != null ? String(postCount) : '-'} />
      <StatItem label="분야" value={tradeDisplay} />
      <StatItem label="경력" value={experienceDisplay} />
      <StatItem label="역할" value={roleDisplay} />
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-3">
      <span className="text-r-12 text-morton-gray-500">{label}</span>
      <span className="text-sb-14 text-morton-primary">{value}</span>
    </div>
  )
}
