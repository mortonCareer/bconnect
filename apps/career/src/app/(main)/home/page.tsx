'use client'

import { useRouter } from 'next/navigation'
import { TopBar } from '@morton/ui'
import { useFeedStore } from '../../../stores/feed-store'
import { FeedList } from './_components/FeedList'
import { FilterSheet } from './_components/FilterSheet'
import { FilterTags } from './_components/FilterTags'

export default function HomePage() {
  const router = useRouter()
  const setFilterOpen = useFeedStore((s) => s.setFilterOpen)

  return (
    <div className="bg-white">
      <TopBar
        variant="home"
        onFilter={() => setFilterOpen(true)}
        onChat={() => router.push('/messages')}
      />
      <FilterTags />
      <FeedList />
      <FilterSheet />
    </div>
  )
}
