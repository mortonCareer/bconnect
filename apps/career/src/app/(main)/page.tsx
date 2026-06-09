/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-5449
 * @figma-state 필터선택 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-5501
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@bconnect/ui'
import { useUnreadNotificationCount } from '@bconnect/features'
import { FeedList } from './_components/home/FeedList'
import { FilterSheet } from './_components/home/FilterSheet'
import { FilterTags } from './_components/home/FilterTags'

export default function HomePage() {
  const router = useRouter()
  const [isFilterOpen, setFilterOpen] = useState(false)
  const goToMessages = () => router.push('/messages')
  const goToNotifications = () => router.push('/notifications')
  const notifyCount = useUnreadNotificationCount()

  return (
    <div className="bg-white">
      <TopBar
        variant="home"
        onFilter={() => setFilterOpen(true)}
        onChat={goToMessages}
        onNotify={goToNotifications}
        notifyCount={notifyCount}
      />
      <FilterTags />
      <FeedList />
      <FilterSheet isOpen={isFilterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  )
}
