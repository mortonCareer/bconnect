'use client'

import { useMemo } from 'react'
import { TRADE_LABELS, useGetFeeds, useGetMyMember } from '@bconnect/api-client'
import type { Trade, ProfileRole } from '@bconnect/api-client'
import { formatRelativeTime } from '@bconnect/config/format'
import { getAvatarUrl } from '@bconnect/config/avatar'
import { FILTER_ROLES, ROLE_LABELS } from '@/lib/role-labels'
import { REGIONS, REGION_LABELS, type Region } from '@/lib/region'
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
    company: string
    duration: string
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

const mockRoleFor = (memberId: number): ProfileRole => FILTER_ROLES[memberId % FILTER_ROLES.length]
const mockRegionFor = (memberId: number): Region => REGIONS[memberId % REGIONS.length]

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
    if (!feeds) return []

    return feeds.flatMap((feed): FeedItem[] => {
      const { member, profile, post } = feed

      // TODO: BE required 처리 후 type narrowing 필요. Feed.member/profile/post와 id가 optional emit이라 없는 행은 임시로 렌더 제외.
      const memberId = member?.id
      const postId = post?.id
      if (!member || !profile || !post || memberId == null || postId == null) return []

      const role = mockRoleFor(memberId)
      const region = mockRegionFor(memberId)
      const { primaryTrade } = profile

      // ProfileSummary에는 trades 배열이 없어서 현재 계약에서는 대표 분야 기준으로 필터링한다.
      if (trades?.length && (!primaryTrade || !trades.includes(primaryTrade))) return []
      if (roles?.length && !roles.includes(role)) return []
      if (regions?.length && !regions.includes(region)) return []
      if (minExperience != null && (profile.experience ?? 0) < minExperience) return []
      if (maxExperience != null && (profile.experience ?? 0) > maxExperience) return []
      if (authorId != null && memberId !== authorId) return []

      // TODO: BE required 처리 후 type narrowing 필요. 이름/분야/작성일/본문은 카드 표시 필수값인데 optional emit이라 fallback 중.
      return [
        {
          postId,
          memberId,
          isMine: currentUserId != null && memberId === currentUserId,
          profile: {
            // picture nullable → 빈 string fallback 시 <img src=""> 가 page URL 재 fetch 하는
            // 브라우저 anti-pattern. DiceBear 아바타 (getAvatarUrl) 로 deterministic fallback.
            image: member.picture || getAvatarUrl(member.name ?? 'user'),
            name: member.name ?? '',
            location: `${REGION_LABELS[region]}(Mocked)`,
            jobType: `${ROLE_LABELS[role]}(Mocked)`,
            specialty: primaryTrade ? (TRADE_LABELS[primaryTrade] ?? '') : '',
            bio: profile.headline ?? '',
          },
          content: {
            images: post.images?.length ? post.images : ['/placeholder-post.svg'],
            // TODO: Feed API에 Task 정보 포함 필요 (#197)
            company: '서정 건축',
            duration: '4일 소요',
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
