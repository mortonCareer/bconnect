/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-5449
 * @figma-state 필터선택 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-5501
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@bconnect/ui'
import { FeedList } from './_components/home/FeedList'
import { FilterSheet } from './_components/home/FilterSheet'
import { FilterTags } from './_components/home/FilterTags'

export default function HomePage() {
  const router = useRouter()
  const [isFilterOpen, setFilterOpen] = useState(false)

  return (
    <div className="bg-white">
      <TopBar
        variant="home"
        onFilter={() => setFilterOpen(true)}
        onChat={() => router.push('/messages')}
      />
      <FilterTags />
      <FeedList />
      <FilterSheet isOpen={isFilterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  )
}
