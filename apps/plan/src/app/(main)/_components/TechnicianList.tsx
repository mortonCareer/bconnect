'use client'

import { useFilterParams } from '@/hooks/useFilterParams'
import { useTechnicianItems } from '@/hooks/useTechnicianItems'
import { CrawledTechnicianCard } from './CrawledTechnicianCard'
import { TechnicianCard } from './TechnicianCard'

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[13px] border border-gray-300 bg-white p-7">
      <div className="flex gap-[18px]">
        <div className="h-[90px] w-[90px] shrink-0 rounded-full bg-gray-100" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <div className="h-5 w-24 rounded bg-gray-100" />
          <div className="h-3 w-40 rounded bg-gray-100" />
          <div className="h-3 w-28 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

export function TechnicianList() {
  const { trades, experience, grades, regions } = useFilterParams()
  const { items, isLoading, error } = useTechnicianItems({ trades, experience, grades, regions })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-[18px] pb-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-m-14 text-gray-500">목록을 불러오지 못했습니다.</p>
        <button
          onClick={() => window.location.reload()}
          className="text-r-14 text-primary underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-m-14 text-gray-500">검색 결과가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[18px] pb-10">
      {items.map((item) =>
        item.source === 'crawled' ? (
          <CrawledTechnicianCard key={`crawled-${item.crawledId}`} item={item} />
        ) : (
          <TechnicianCard key={`member-${item.profileId}`} item={item} />
        )
      )}
    </div>
  )
}
