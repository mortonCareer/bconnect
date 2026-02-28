'use client'

import { useRouter } from 'next/navigation'
import { TopBar } from '@morton/ui'
import { useFeedStore } from '@/stores/feed-store'
import { FeedList } from './_components/home/FeedList'
import { FilterSheet } from './_components/home/FilterSheet'
import { FilterTags } from './_components/home/FilterTags'

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
