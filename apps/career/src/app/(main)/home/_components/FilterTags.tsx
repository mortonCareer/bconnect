'use client'

import { Tag } from '@morton/ui'
import { useFeedStore } from '../../../../stores/feed-store'
import { TRADE_LABELS } from '../../../../lib/trade-labels'

export function FilterTags() {
  const selectedTrade = useFeedStore((s) => s.selectedTrade)
  const clearFilter = useFeedStore((s) => s.clearFilter)

  if (!selectedTrade) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Tag variant="filter" onRemove={clearFilter}>
        {TRADE_LABELS[selectedTrade]}
      </Tag>
    </div>
  )
}
