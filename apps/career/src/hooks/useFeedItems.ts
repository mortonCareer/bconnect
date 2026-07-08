'use client'

import { useMemo } from 'react'
import { TRADE_LABELS, useGetFeeds, useGetMyMember } from '@bconnect/api-client'
import type { Trade, ProfileRole } from '@bconnect/api-client'
import { formatRelativeTime } from '@bconnect/config/format'
import { getAvatarUrl } from '@bconnect/config/avatar'
import { FILTER_ROLES, ROLE_LABELS } from '@/lib/role-labels'
import { REGIONS, REGION_LABELS, type Region } from '@/lib/region'

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
  const currentUserId = useGetMyMember().data?.id

  const feedItems: FeedItem[] = useMemo(() => {
    if (!feeds) return []

    return feeds
      .filter((feed) => {
        const memberId = feed.member?.id ?? 0
        if (trades?.length && !trades.some((t) => feed.profile.trades?.includes(t))) return false
        if (roles?.length && !roles.includes(mockRoleFor(memberId))) return false
        if (regions?.length && !regions.includes(mockRegionFor(memberId))) return false
        if (minExperience != null && (feed.profile.experience ?? 0) < minExperience) return false
        if (maxExperience != null && (feed.profile.experience ?? 0) > maxExperience) return false
        if (authorId != null && feed.member.id !== authorId) return false
        return true
      })
      .map((feed): FeedItem | null => {
        const { member, profile, post } = feed

        // TODO: BE required 처리 후 type narrowing 필요. Feed.member/profile/post가 optional emit이라 없는 행은 임시로 렌더 제외.
        if (!member || !profile || !post) return null

        // TODO: BE required 처리 후 type narrowing 필요. 이름/분야/작성일/본문은 카드 표시 필수값인데 optional emit이라 fallback 중.
        return {
          postId: post.id,
          memberId: member.id,
          isMine: currentUserId != null && member.id === currentUserId,
          profile: {
            // picture nullable → 빈 string fallback 시 <img src=""> 가 page URL 재 fetch 하는
            // 브라우저 anti-pattern. DiceBear 아바타 (getAvatarUrl) 로 deterministic fallback.
            image: member.picture || getAvatarUrl(member.name ?? 'user'),
            name: member.name ?? '',
            location: `${REGION_LABELS[mockRegionFor(member.id)]}(Mocked)`,
            jobType: `${ROLE_LABELS[mockRoleFor(member.id)]}(Mocked)`,
            specialty: profile.primaryTrade ? (TRADE_LABELS[profile.primaryTrade] ?? '') : '',
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
        }
      })
      .filter((item): item is FeedItem => item !== null)
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
