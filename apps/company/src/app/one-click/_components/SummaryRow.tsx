import type { CheckItem } from '@bconnect/business/types'
import { StatusBadge } from './StatusBadge'

interface SummaryRowProps {
  item: CheckItem
}

export function SummaryRow({ item }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-r-14 text-gray-900">{item.label}</span>
        <span className="text-r-14 text-gray-500">{item.source}</span>
      </div>
      <StatusBadge status={item.status} statusType={item.statusType} />
    </div>
  )
}
