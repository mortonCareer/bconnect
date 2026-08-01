'use client'

import { useGetFeeds } from '@bconnect/api-client'
import type { Feed } from '@bconnect/api-client'
import { Skeleton } from '@bconnect/ui'
import { WorkCard } from './WorkCard'
import { formatRelativeTime } from '@bconnect/config/format'
import { feedWork } from '../../_shared/feed'

interface WorksTabProps {
  /** 표시 대상 회원의 memberId (GET /feeds 가 전역이라 클라이언트에서 이 값으로 필터) */
  profileId: number
  /** owner 전용 작업물 수정 href 빌더. 없으면 케밥 메뉴 안 그림 (viewer/plan) */
  workEditHref?: (postId: number) => string
  /** owner 전용 작업물 삭제. 없으면 케밥 삭제 메뉴 안 그림 (viewer/plan) */
  onDeleteWork?: (postId: number) => void
}

export function WorksTab({ profileId, workEditHref, onDeleteWork }: WorksTabProps) {
  const enabled = Number.isFinite(profileId) && profileId > 0
  // GET /feeds 는 전역(회원별 파라미터 없음) → memberId 로 클라이언트 필터
  // (BE 회원별 feed 엔드포인트 추가 시 대체)
  const { data: feeds, isLoading } = useGetFeeds(undefined, { query: { enabled } })

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

  // TODO: BE required 처리 후 type narrowing 필요. Feed.post/Post.memberId가 optional emit이라 없는 항목은 임시로 렌더 제외.
  const works: Feed[] = (feeds?.content ?? []).filter(
    (feed) => feed.post && feed.post.memberId === profileId
  )

  if (works.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-r-14 text-gray-500">작업물이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      {works.map((feed) => {
        // TODO: BE required 처리 후 type narrowing 필요. Post.id/createdAt/content는 카드 표시 필수값인데 optional emit이라 fallback 중.
        const post = feed.post
        const postId = post?.id
        if (post == null || postId == null) return null
        const { images, company, duration } = feedWork(feed)
        return (
          <WorkCard
            key={postId}
            images={images}
            company={company}
            duration={duration}
            timestamp={post.createdAt ? formatRelativeTime(post.createdAt) : ''}
            description={post.content ?? ''}
            editHref={workEditHref?.(postId)}
            onDelete={onDeleteWork ? () => onDeleteWork(postId) : undefined}
          />
        )
      })}
    </div>
  )
}
