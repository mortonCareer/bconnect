'use client'

import { Suspense } from 'react'
import { FilterBar } from './FilterBar'
import { TechnicianList } from './TechnicianList'

export function ExploreContent() {
  return (
    <Suspense>
      <div className="flex flex-col gap-[27px]">
        <FilterBar />
        <TechnicianList />
      </div>
    </Suspense>
  )
}
