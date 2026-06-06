'use client'

import { Tag } from '@bconnect/ui'
import { TRADE_LABELS } from '@bconnect/api-client'
import { formatExperienceRange } from '@/lib/experience-range'
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
          {formatExperienceRange(selectedExperience)}
        </Tag>
      )}
    </div>
  )
}
