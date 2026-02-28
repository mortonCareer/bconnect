import type { CheckItem } from '../_clients/types'
import { CATEGORY_GROUPS } from './constants'
import { SummaryRow } from './SummaryRow'

interface SummarySectionProps {
  checkItems: CheckItem[]
}

export function SummarySection({ checkItems }: SummarySectionProps) {
  const itemMap = new Map(checkItems.map((item) => [item.id, item]))

  return (
    <div className="rounded-xl border border-morton-gray-300 bg-white">
      {CATEGORY_GROUPS.map((group) => (
        <div key={group.id}>
          <div className="border-b border-morton-gray-300 bg-morton-gray-100 px-6 py-2 first:rounded-t-xl">
            <span className="text-sb-14 text-morton-gray-700">{group.label}</span>
          </div>
          <div className="px-6">
            {group.itemIds.map((itemId) => {
              const item = itemMap.get(itemId)
              if (!item) return null
              return <SummaryRow key={itemId} item={item} />
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
