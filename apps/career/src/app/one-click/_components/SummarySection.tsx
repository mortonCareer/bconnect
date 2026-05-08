import { Suspense } from 'react'
import type { CheckItemId } from '../_clients/types'
import { fetchCheckItemById } from '../_clients/fetch-business'
import { CATEGORY_GROUPS } from './constants'
import { SummaryRow } from './SummaryRow'

interface SummarySectionProps {
  registrationNumber: string
}

function SummaryRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="h-4 w-32 animate-pulse rounded bg-bconnect-gray-200" />
      <div className="h-5 w-16 animate-pulse rounded-full bg-bconnect-gray-200" />
    </div>
  )
}

async function SummaryItemLoader({
  id,
  registrationNumber,
}: {
  id: CheckItemId
  registrationNumber: string
}) {
  const item = await fetchCheckItemById(id, registrationNumber)
  return <SummaryRow item={item} />
}

export function SummarySection({ registrationNumber }: SummarySectionProps) {
  return (
    <div className="rounded-xl border border-bconnect-gray-300 bg-white">
      {CATEGORY_GROUPS.map((group) => (
        <div key={group.id}>
          <div className="border-b border-bconnect-gray-300 bg-bconnect-gray-100 px-6 py-2 first:rounded-t-xl">
            <span className="text-sb-14 text-bconnect-gray-700">{group.label}</span>
          </div>
          <div className="px-6">
            {group.itemIds.map((itemId) => (
              <Suspense key={itemId} fallback={<SummaryRowSkeleton />}>
                <SummaryItemLoader id={itemId} registrationNumber={registrationNumber} />
              </Suspense>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
