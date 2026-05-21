/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1449-5034
 */
'use client'

import { Suspense } from 'react'
import { FilterBar } from './_components/FilterBar'
import { TechnicianList } from './_components/TechnicianList'

export default function ExplorePage() {
  return (
    <Suspense>
      <div className="flex flex-col gap-[27px]">
        <FilterBar />
        <TechnicianList />
      </div>
    </Suspense>
  )
}
