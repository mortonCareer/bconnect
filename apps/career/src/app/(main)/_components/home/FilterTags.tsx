'use client'

import { Tag } from '@morton/ui'
import { useFeedStore } from '@/stores/feed-store'
import { TRADE_LABELS } from '@/lib/trade-labels'
import { EXPERIENCE_LABELS } from '@/lib/experience'

export function FilterTags() {
  const primaryTrade = useFeedStore((s) => s.primaryTrade)
  const selectedExperience = useFeedStore((s) => s.selectedExperience)
  const clearTrade = useFeedStore((s) => s.clearTrade)
  const clearExperience = useFeedStore((s) => s.clearExperience)

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
