'use client'

import { useGetFeeds } from '@bconnect/api-client'
import { Skeleton } from '@bconnect/ui'
import { WorkCard } from './WorkCard'
import { formatRelativeTime } from './labels'

interface WorksTabProps {
  profileId: number
}

export function WorksTab({ profileId }: WorksTabProps) {
  const enabled = Number.isFinite(profileId) && profileId > 0
  const { data: feeds, isLoading } = useGetFeeds({ profileId }, { query: { enabled } })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 py-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="h-[220px] w-full rounded-none" />
            <Skeleton className="mx-4 h-4 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  const posts = feeds?.content ?? []

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-r-14 text-gray-500">작업물이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      {posts.map(({ post }) => (
        <WorkCard
          key={post.id}
          image={post.images?.[0] ?? ''}
          timestamp={post.createdAt ? formatRelativeTime(post.createdAt) : ''}
          description={post.content ?? ''}
        />
      ))}
    </div>
  )
}
