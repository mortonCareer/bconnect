'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Feed } from '@morton/ui'
import { useFeedItems } from '@/hooks/useFeedItems'

interface WorksSectionProps {
  authorId: number
}

export function WorksSection({ authorId }: WorksSectionProps) {
  const { feedItems, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useFeedItems({
    authorId,
  })

  const observerRef = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const el = observerRef.current
    if (!el) return

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleObserver])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-m-14 text-morton-gray-500">로딩 중...</p>
      </div>
    )
  }

  if (feedItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-m-14 text-morton-gray-500">작업물이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {feedItems.map((item) => (
        <Feed key={item.postId} profile={item.profile} content={item.content} />
      ))}
      <div ref={observerRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <p className="text-r-12 text-morton-gray-400">불러오는 중...</p>
        </div>
      )}
    </div>
  )
}
