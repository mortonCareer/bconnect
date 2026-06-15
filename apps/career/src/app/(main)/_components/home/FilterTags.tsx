'use client'

import { Tag } from '@bconnect/ui'
import { TRADE_LABELS } from '@bconnect/api-client'
import { formatExperienceRange } from '@/lib/experience-range'
import { useFilterParams } from '@/hooks/useFilterParams'

export function FilterTags() {
  const {
    trades,
    primaryTrade,
    experience: selectedExperience,
    removeTrade,
    clearPrimary,
    clearExperience,
  } = useFilterParams()

  if (trades.length === 0 && !primaryTrade && !selectedExperience) return null

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2">
      {trades.map((trade) => (
        <Tag key={trade} variant="filter" onRemove={() => removeTrade(trade)}>
          {TRADE_LABELS[trade]}
        </Tag>
      ))}
      {primaryTrade && (
        <Tag variant="filter" onRemove={clearPrimary}>
          {TRADE_LABELS[primaryTrade]} (대표)
        </Tag>
      )}
      {selectedExperience && (
        <Tag variant="filter" onRemove={clearExperience}>
          {formatExperienceRange(selectedExperience)}
        </Tag>
      )}
    </div>
  )
}
