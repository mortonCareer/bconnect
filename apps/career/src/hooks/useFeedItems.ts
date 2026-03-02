'use client'

import {
  useInfiniteQuery,
  useQueries,
  getPosts,
  getProfile,
  getMember,
  getTask,
  getGetPostsQueryKey,
  getGetProfileQueryOptions,
  getGetMemberQueryOptions,
  getGetTaskQueryOptions,
} from '@morton/api-client'
import type { Post, Profile, Member, Task, Trade } from '@morton/api-client'
import { TRADE_LABELS } from '../lib/trade-labels'
import { formatRelativeTime, formatDuration } from '../lib/format-time'

export interface FeedItem {
  postId: number
  memberId?: number
  profile: {
    image: string
    name: string
    location: string
    jobType: string
    specialty: string
    bio: string
  }
  content: {
    image: string
    imageAlt?: string
    company: string
    duration: string
    timestamp: string
    description: string
  }
}

interface UseFeedItemsOptions {
  trade?: Trade | null
  minExperience?: number
  maxExperience?: number
  authorId?: number
  limit?: number
}

export function useFeedItems({
  trade,
  minExperience,
  maxExperience,
  authorId,
  limit = 20,
}: UseFeedItemsOptions = {}) {
  const postsQuery = useInfiniteQuery({
    queryKey: [
      ...getGetPostsQueryKey({
        trade: trade ?? undefined,
        minExperience,
        maxExperience,
        authorId,
        limit,
      }),
      'infinite',
    ],
    queryFn: ({ pageParam }) =>
      getPosts({
        trade: trade ?? undefined,
        minExperience,
        maxExperience,
        authorId,
        cursor: pageParam as string | undefined,
        limit,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? (lastPage.meta.nextCursor ?? undefined) : undefined,
  })

  const allPosts = postsQuery.data?.pages.flatMap((page) => page.items) ?? []

  // Unique IDs 추출
  const profileIds = [...new Set(allPosts.map((p) => p.authorId).filter(Boolean))] as number[]
  const taskIds = [...new Set(allPosts.map((p) => p.taskId).filter(Boolean))] as number[]

  // 병렬 Profile 조회
  const profileQueries = useQueries({
    queries: profileIds.map((id) => ({
      ...getGetProfileQueryOptions(id),
      enabled: profileIds.length > 0,
    })),
  })

  // Profile → Member ID 매핑
  const profileMap = new Map<number, Profile>()
  profileQueries.forEach((q, i) => {
    if (q.data) profileMap.set(profileIds[i], q.data)
  })

  const memberIds = [
    ...new Set([...profileMap.values()].map((p) => p.memberId).filter(Boolean)),
  ] as number[]

  // 병렬 Member 조회
  const memberQueries = useQueries({
    queries: memberIds.map((id) => ({
      ...getGetMemberQueryOptions(id),
      enabled: memberIds.length > 0,
    })),
  })

  const memberMap = new Map<number, Member>()
  memberQueries.forEach((q, i) => {
    if (q.data) memberMap.set(memberIds[i], q.data)
  })

  // 병렬 Task 조회
  const taskQueries = useQueries({
    queries: taskIds.map((id) => ({
      ...getGetTaskQueryOptions(id),
      enabled: taskIds.length > 0,
    })),
  })

  const taskMap = new Map<number, Task>()
  taskQueries.forEach((q, i) => {
    if (q.data) taskMap.set(taskIds[i], q.data)
  })

  // Post → FeedItem 변환
  const feedItems: FeedItem[] = allPosts
    .map((post): FeedItem | null => {
      const profile = post.authorId ? profileMap.get(post.authorId) : undefined
      const member = profile?.memberId ? memberMap.get(profile.memberId) : undefined
      const task = post.taskId ? taskMap.get(post.taskId) : undefined

      if (!profile || !member) return null

      return {
        postId: post.id!,
        memberId: member.id,
        profile: {
          image: member.picture ?? '',
          name: member.name ?? '',
          location: profile.address?.city ?? '',
          jobType: member.role ? getRoleLabel(member.role) : '',
          specialty: profile.primaryTrade ? (TRADE_LABELS[profile.primaryTrade] ?? '') : '',
          bio: profile.headline ?? '',
        },
        content: {
          image: post.images?.[0] || '/placeholder-post.svg',
          company: task?.company ?? '',
          duration: task?.start && task?.end ? formatDuration(task.start, task.end) : '',
          timestamp: post.createdAt ? formatRelativeTime(post.createdAt) : '',
          description: post.content ?? '',
        },
      }
    })
    .filter((item): item is FeedItem => item !== null)

  const isLoading =
    postsQuery.isLoading ||
    profileQueries.some((q) => q.isLoading) ||
    memberQueries.some((q) => q.isLoading) ||
    taskQueries.some((q) => q.isLoading)

  return {
    feedItems,
    postCount: allPosts.length,
    isLoading,
    isFetchingNextPage: postsQuery.isFetchingNextPage,
    hasNextPage: postsQuery.hasNextPage,
    fetchNextPage: postsQuery.fetchNextPage,
    error: postsQuery.error,
  }
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    GUEST: '게스트',
    ARCHITECT: '건축사',
    CONTRACTOR: '시공사',
    FOREMAN: '반장',
    WORKER: '기술자',
    ADMIN: '관리자',
  }
  return labels[role] ?? role
}
