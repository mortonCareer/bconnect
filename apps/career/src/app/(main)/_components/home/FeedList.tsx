'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useDeletePost, useQueryClient, getGetFeedsQueryKey } from '@bconnect/api-client'
import { Feed, ConfirmDialog, Button } from '@bconnect/ui'
import { useFeedItems } from '@/hooks/useFeedItems'
import { useFilterParams } from '@/hooks/useFilterParams'

export function FeedList() {
  const queryClient = useQueryClient()
  const { mutate: deletePost } = useDeletePost()
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const { trades, roles, regions, expRange } = useFilterParams()

  const { feedItems, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useFeedItems({
      trades,
      roles,
      regions,
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
      <div className="flex flex-col gap-6 px-4 py-6">
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-m-14 text-gray-400">피드를 불러오지 못했어요</p>
        <Button
          variant="outline"
          size="sm"
          // config 대상 밖: 유저 트리거 (mutation onSuccess 아님) — ADR-0025
          onClick={() => queryClient.invalidateQueries({ queryKey: getGetFeedsQueryKey() })}
        >
          다시 시도
        </Button>
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
    <div className="flex flex-col gap-6 px-4 py-2">
      {feedItems.map((item) => (
        <Feed
          key={item.postId}
          content={item.content}
          canManage={item.isMine}
          editHref={`/profile/edit/work/${item.postId}`}
          onDelete={() => setPendingDeleteId(item.postId)}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={observerRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId != null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        title="게시물을 삭제할까요?"
        description="삭제한 게시물은 복구할 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (pendingDeleteId == null) return
          deletePost(
            { postId: pendingDeleteId },
            // TODO(#728): 수동 무효화 — 추후 config(deletePost→getFeeds) 인계로 대체. getFeeds 파라미터 계약(본인/전체) 정리 시 맞춰 제거 (ADR-0025)
            { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFeedsQueryKey() }) }
          )
          setPendingDeleteId(null)
        }}
      />
    </div>
  )
}
