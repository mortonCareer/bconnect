'use client'

import { Tag } from '@morton/ui'
import { TRADE_LABELS } from '@/lib/trade-labels'
import { EXPERIENCE_LABELS } from '@/lib/experience'
import { useFilterParams } from '@/hooks/useFilterParams'

export function FilterTags() {
  const {
    primaryTrade,
    experience: selectedExperience,
    clearTrade,
    clearExperience,
  } = useFilterParams()

  if (!primaryTrade && !selectedExperience) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {primaryTrade && (
        <Tag variant="filter" onRemove={clearTrade}>
          {TRADE_LABELS[primaryTrade]}
        </Tag>
      )}
      {selectedExperience && (
        <Tag variant="filter" onRemove={clearExperience}>
          {EXPERIENCE_LABELS[selectedExperience]}
        </Tag>
      )}
    </div>
  )
}
