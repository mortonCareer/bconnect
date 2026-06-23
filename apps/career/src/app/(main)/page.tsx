/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-5449
 * @figma-state 필터선택 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-5501
 */
'use client'

import { useState } from 'react'
import { TopBar } from '@bconnect/ui'
import { useGetMyChats } from '@bconnect/api-client'
import { useUnreadNotificationCount } from '@bconnect/features'
import { FeedList } from './_components/home/FeedList'
import { FilterSheet } from './_components/home/FilterSheet'
import { FilterTags } from './_components/home/FilterTags'

export default function HomePage() {
  const [isFilterOpen, setFilterOpen] = useState(false)
  const { data: chats } = useGetMyChats()
  const chatCount = chats?.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0
  const notifyCount = useUnreadNotificationCount()

  return (
    <div className="bg-white">
      <TopBar
        variant="home"
        onFilter={() => setFilterOpen(true)}
        chatHref="/messages"
        chatCount={chatCount}
        notifyHref="/notifications"
        notifyCount={notifyCount}
      />
      <FilterTags />
      <FeedList />
      <FilterSheet isOpen={isFilterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  )
}
