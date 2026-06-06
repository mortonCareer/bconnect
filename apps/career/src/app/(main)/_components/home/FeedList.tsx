'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  useGetMyMember,
  useDeletePost,
  useQueryClient,
  getGetFeedsQueryKey,
} from '@bconnect/api-client'
import { Feed } from '@bconnect/ui'
import { useFeedItems } from '@/hooks/useFeedItems'
import { useFilterParams } from '@/hooks/useFilterParams'

export function FeedList() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const currentUserId = useGetMyMember().data?.id
  const { mutate: deletePost } = useDeletePost()
  const { primaryTrade, expRange } = useFilterParams()

  const { feedItems, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useFeedItems({
    trade: primaryTrade,
    minExperience: expRange?.min,
    maxExperience: expRange?.max,
  })

  const observerRef = useRef<HTMLDivElement | null>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const el = observerRef.current
    if (!el) return

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '100px',
    })
    observer.observe(el)

    return () => observer.disconnect()
  }, [handleObserver])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-3 w-36 rounded bg-gray-200" />
              </div>
            </div>
            <div className="mb-3 aspect-[4/3] rounded-lg bg-gray-200" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-200" />
              <div className="h-3 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (feedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-m-14 text-gray-400">게시물이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-2">
      {feedItems.map((item) => (
        <Feed
          key={item.postId}
          content={item.content}
          canManage={item.memberId != null && item.memberId === currentUserId}
          onEdit={() => router.push(`/profile/edit/work/${item.postId}`)}
          onDelete={() =>
            deletePost(
              { postId: item.postId },
              {
                onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFeedsQueryKey() }),
              }
            )
          }
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={observerRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
        </div>
      )}
    </div>
  )
}
