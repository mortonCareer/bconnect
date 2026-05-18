'use client'

import { useFilterParams } from '@/hooks/useFilterParams'
import { useTechnicianItems } from '@/hooks/useTechnicianItems'
import { TechnicianCard } from './TechnicianCard'

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[13px] border border-bconnect-gray-300 bg-white p-[28px]">
      <div className="flex gap-[18px]">
        <div className="h-[90px] w-[90px] shrink-0 rounded-full bg-bconnect-gray-100" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <div className="h-5 w-24 rounded bg-bconnect-gray-100" />
          <div className="h-3 w-40 rounded bg-bconnect-gray-100" />
          <div className="h-3 w-28 rounded bg-bconnect-gray-100" />
        </div>
      </div>
    </div>
  )
}

export function TechnicianList() {
  const { trade, experience, region } = useFilterParams()
  const { items, isLoading, error } = useTechnicianItems({ trade, experience, region })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-[18px]">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-m-14 text-bconnect-gray-500">목록을 불러오지 못했습니다.</p>
        <button
          onClick={() => window.location.reload()}
          className="text-r-14 text-bconnect-primary underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-m-14 text-bconnect-gray-500">검색 결과가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {items.map((item) => (
        <TechnicianCard key={item.profileId} item={item} />
      ))}
    </div>
  )
}
