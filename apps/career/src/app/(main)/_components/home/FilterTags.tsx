'use client'

import { Tag } from '@bconnect/ui'
import { ROLE_LABELS, TRADE_LABELS } from '@bconnect/api-client'
import { REGION_LABELS } from '@/lib/region'
import { formatExperienceRange } from '@/lib/experience-range'
import { useFilterParams } from '@/hooks/useFilterParams'

export function FilterTags() {
  const {
    trades,
    roles,
    regions,
    experience: selectedExperience,
    removeTrade,
    removeRole,
    removeRegion,
    clearExperience,
  } = useFilterParams()

  if (trades.length === 0 && roles.length === 0 && regions.length === 0 && !selectedExperience) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2">
      {trades.map((trade) => (
        <Tag key={trade} variant="filter" onRemove={() => removeTrade(trade)}>
          {TRADE_LABELS[trade]}
        </Tag>
      ))}
      {roles.map((role) => (
        <Tag key={role} variant="filter" onRemove={() => removeRole(role)}>
          {ROLE_LABELS[role]}
        </Tag>
      ))}
      {regions.map((region) => (
        <Tag key={region} variant="filter" onRemove={() => removeRegion(region)}>
          {REGION_LABELS[region]}
        </Tag>
      ))}
      {selectedExperience && (
        <Tag variant="filter" onRemove={clearExperience}>
          {formatExperienceRange(selectedExperience)}
        </Tag>
      )}
    </div>
  )
}
