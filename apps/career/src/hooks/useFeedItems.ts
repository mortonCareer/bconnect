'use client'

import { useMemo } from 'react'
import { regionOfState, TRADE_LABELS, useGetFeeds, useGetMyMember } from '@bconnect/api-client'
import type { Trade, ProfileRole } from '@bconnect/api-client'
import { toWork } from '@bconnect/features'
import { formatRelativeTime } from '@bconnect/config/format'
import { DEFAULT_PROFILE_IMAGE } from '@bconnect/config/avatar'
import { ROLE_LABELS } from '@/lib/role-labels'
import { REGION_LABELS, type Region } from '@/lib/region'
import { useAuthStore } from '@/stores/auth-store'

export interface FeedItem {
  postId: number
  memberId?: number
  /** 현재 로그인 사용자의 게시물 여부 — 케밥(수정/삭제) 노출 게이트 */
  isMine: boolean
  profile: {
    image: string
    name: string
    location: string
    jobType: string
    specialty: string
    bio: string
  }
  content: {
    images: string[]
    imageAlt?: string
    /** 건축주(발주 업체)명 — 글에 연결된 작업(task)이 없으면 생략 */
    company?: string
    /** 시공기간 — task.start~end 일수 (없으면 생략) */
    duration?: string
    timestamp: string
    description: string
  }
}

interface UseFeedItemsOptions {
  trades?: Trade[]
  roles?: ProfileRole[]
  regions?: Region[]
  minExperience?: number
  maxExperience?: number
  authorId?: number
  limit?: number
}

export function useFeedItems({
  trades,
  roles,
  regions,
  minExperience,
  maxExperience,
  authorId,
}: UseFeedItemsOptions = {}) {
  const { data: feeds, isLoading, error } = useGetFeeds()
  // 홈 피드는 public — members/me 는 인증 필요라 로그아웃 상태면 정지, isMine 전부 false (#802)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentUserId = useGetMyMember({ query: { enabled: isAuthenticated } }).data?.id

  const feedItems: FeedItem[] = useMemo(() => {
    if (!feeds?.content) return []

    return feeds.content.flatMap((feed): FeedItem[] => {
      const { member, profile, post } = feed

      // TODO: BE required 처리 후 type narrowing 필요. Feed.member/profile/post와 id가 optional emit이라 없는 행은 임시로 렌더 제외.
      const memberId = member?.id
      const postId = post?.id
      if (!member || !profile || !post || memberId == null || postId == null) return []

      const role = profile.role
      const region = regionOfState(profile.address?.state)
      const { primaryTrade } = profile

      // ProfileSummary에는 trades 배열이 없어서 현재 계약에서는 대표 분야 기준으로 필터링한다.
      if (trades?.length && (!primaryTrade || !trades.includes(primaryTrade))) return []
      if (roles?.length && (role == null || !roles.includes(role))) return []
      if (regions?.length && (region == null || !regions.includes(region))) return []
      if (minExperience != null && (profile.experience ?? 0) < minExperience) return []
      if (maxExperience != null && (profile.experience ?? 0) > maxExperience) return []
      if (authorId != null && memberId !== authorId) return []

      const work = toWork(feed)

      // TODO: BE required 처리 후 type narrowing 필요. 이름/분야/작성일/본문은 카드 표시 필수값인데 optional emit이라 fallback 중.
      return [
        {
          postId,
          memberId,
          isMine: currentUserId != null && memberId === currentUserId,
          profile: {
            // picture nullable → 빈 string fallback 시 <img src=""> 가 page URL 재 fetch 하는
            // 브라우저 anti-pattern. 정적 기본 프로필 이미지로 fallback.
            image: member.picture || DEFAULT_PROFILE_IMAGE,
            name: member.name ?? '',
            location: region ? REGION_LABELS[region] : '',
            jobType: role ? ROLE_LABELS[role] : '',
            specialty: primaryTrade ? (TRADE_LABELS[primaryTrade] ?? '') : '',
            bio: profile.headline ?? '',
          },
          content: {
            images: work.images.length ? work.images : ['/placeholder-post.svg'],
            company: work.company,
            duration: work.duration,
            timestamp: post.createdAt ? formatRelativeTime(post.createdAt) : '',
            description: post.content ?? '',
          },
        },
      ]
    })
  }, [feeds, trades, roles, regions, minExperience, maxExperience, authorId, currentUserId])

  return {
    feedItems,
    postCount: feedItems.length,
    isLoading,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: () => {},
    error,
  }
}
