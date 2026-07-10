'use client'

import { useGetFeeds } from '@bconnect/api-client'
import type { Post } from '@bconnect/api-client'
import { Button, PlusIcon, Skeleton } from '@bconnect/ui'
import Link from 'next/link'
import { WorkCard } from './WorkCard'
import { formatRelativeTime } from '@bconnect/config/format'

interface WorksTabProps {
  /** 표시 대상 회원의 memberId (GET /feeds 가 전역이라 클라이언트에서 이 값으로 필터) */
  profileId: number
  /** owner 전용 작업물 등록 페이지 href. 지정 시 탭 상단에 "작업물 게시" 버튼 노출 (viewer/plan 은 미지정) */
  workCreateHref?: string
  /** owner 전용 작업물 수정 href 빌더. 없으면 케밥 메뉴 안 그림 (viewer/plan) */
  workEditHref?: (postId: number) => string
  /** owner 전용 작업물 삭제. 없으면 케밥 삭제 메뉴 안 그림 (viewer/plan) */
  onDeleteWork?: (postId: number) => void
}

export function WorksTab({ profileId, workCreateHref, workEditHref, onDeleteWork }: WorksTabProps) {
  const enabled = Number.isFinite(profileId) && profileId > 0
  // GET /feeds 는 전역(회원별 파라미터 없음) → memberId 로 클라이언트 필터
  // (BE 회원별 feed 엔드포인트 추가 시 대체)
  const { data: feeds, isLoading } = useGetFeeds({ query: { enabled } })

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
  const posts: Post[] = (feeds ?? []).flatMap((feed) =>
    feed.post && feed.post.memberId === profileId ? [feed.post] : []
  )

  const createButton = workCreateHref ? (
    <div className="flex justify-end px-4 pt-4">
      <Button asChild variant="outline" size="sm">
        <Link href={workCreateHref}>
          <PlusIcon size={16} />
          작업물 게시
        </Link>
      </Button>
    </div>
  ) : null

  if (posts.length === 0) {
    return (
      <>
        {createButton}
        <div className="flex items-center justify-center py-20">
          <p className="text-r-14 text-gray-500">작업물이 없습니다</p>
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {createButton}
      {posts.map((post) => {
        // TODO: BE required 처리 후 type narrowing 필요. Post.id/createdAt/content는 카드 표시 필수값인데 optional emit이라 fallback 중.
        const postId = post.id
        if (postId == null) return null
        return (
          <WorkCard
            key={postId}
            image={post.images?.[0] ?? ''}
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
