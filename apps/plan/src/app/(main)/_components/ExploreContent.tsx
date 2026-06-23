'use client'

import { Suspense } from 'react'
import { FilterBar } from './FilterBar'
import { TechnicianList } from './TechnicianList'

export function ExploreContent() {
  return (
    <Suspense>
      <div className="flex w-full max-w-290 flex-col gap-[27px] px-10 py-10">
        <FilterBar />
        <TechnicianList />
      </div>
    </Suspense>
  )
}
