'use client'

import { Tag } from '@bconnect/ui'
import { TRADE_LABELS } from '@bconnect/api-client'
import { ROLE_LABELS } from '@/lib/role-labels'
import { formatExperienceRange } from '@/lib/experience-range'
import { useFilterParams } from '@/hooks/useFilterParams'

export function FilterTags() {
  const {
    trades,
    roles,
    experience: selectedExperience,
    removeTrade,
    removeRole,
    clearExperience,
  } = useFilterParams()

  if (trades.length === 0 && roles.length === 0 && !selectedExperience) {
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
      {selectedExperience && (
        <Tag variant="filter" onRemove={clearExperience}>
          {formatExperienceRange(selectedExperience)}
        </Tag>
      )}
    </div>
  )
}
