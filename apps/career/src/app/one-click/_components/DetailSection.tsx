import { Suspense } from 'react'
import type { CheckItemId } from '@/lib/business/types'
import { fetchCheckItemById } from '@/lib/business/fetch-business'
import { CATEGORY_GROUPS } from './constants'
import { AccordionShell, DetailAccordionItem } from './DetailAccordion'

interface DetailSectionProps {
  registrationNumber: string
}

function DetailItemSkeleton() {
  return (
    <div className="border-b border-gray-200 py-3 last:border-b-0">
      <div className="flex items-center gap-2">
        <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="mt-1 h-3 w-48 animate-pulse rounded bg-gray-100" />
    </div>
  )
}

async function DetailItemLoader({
  id,
  registrationNumber,
}: {
  id: CheckItemId
  registrationNumber: string
}) {
  const item = await fetchCheckItemById(id, registrationNumber)
  return <DetailAccordionItem item={item} registrationNumber={registrationNumber} />
}

export function DetailSection({ registrationNumber }: DetailSectionProps) {
  return (
    <div className="flex flex-col gap-8">
      {CATEGORY_GROUPS.map((group) => (
        <section key={group.id}>
          <h3 className="text-sb-20 text-gray-900">{group.label}</h3>
          {group.id === 'WAGE_RESTRICTION' && (
            <p className="mt-1 text-r-12 text-gray-500">공표기간이 지난 정보는 표시되지 않습니다</p>
          )}

          <AccordionShell className="mt-3">
            {group.itemIds.map((itemId) => (
              <Suspense key={itemId} fallback={<DetailItemSkeleton />}>
                <DetailItemLoader id={itemId} registrationNumber={registrationNumber} />
              </Suspense>
            ))}
          </AccordionShell>
        </section>
      ))}
    </div>
  )
}
