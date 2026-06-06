'use client'

import { useMemo } from 'react'
import { TRADE_LABELS, useGetFeeds, useGetMyMember } from '@bconnect/api-client'
import type { Trade } from '@bconnect/api-client'
import { formatRelativeTime } from '@bconnect/config/format'
import { getAvatarUrl } from '@bconnect/config/avatar'

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
}: UseFeedItemsOptions = {}) {
  const { data: feeds, isLoading, error } = useGetFeeds()
  const currentUserId = useGetMyMember().data?.id

  const feedItems: FeedItem[] = useMemo(() => {
    if (!feeds) return []

    // useGetFeeds 응답 = FeedOffsetPage = { content: Feed[], hasNext } — content 풀어냄
    return feeds.content
      .filter((feed) => {
        if (trade && feed.profile.primaryTrade !== trade) return false
        if (minExperience != null && (feed.profile.experience ?? 0) < minExperience) return false
        if (maxExperience != null && (feed.profile.experience ?? 0) > maxExperience) return false
        if (authorId != null && feed.member.id !== authorId) return false
        return true
      })
      .map((feed): FeedItem | null => {
        const { member, profile, post } = feed

        if (!member || !profile || !post) return null

        return {
          postId: post.id,
          memberId: member.id,
          isMine: currentUserId != null && member.id === currentUserId,
          profile: {
            // picture nullable → 빈 string fallback 시 <img src=""> 가 page URL 재 fetch 하는
            // 브라우저 anti-pattern. DiceBear 아바타 (getAvatarUrl) 로 deterministic fallback.
            image: member.picture || getAvatarUrl(member.name ?? 'user'),
            name: member.name ?? '',
            location: '',
            // TODO: role 은 MaskedMember 에 없음 (BE public masking) — 필요시 BE 협의 후 부활
            jobType: '',
            specialty: profile.primaryTrade ? (TRADE_LABELS[profile.primaryTrade] ?? '') : '',
            bio: profile.headline ?? '',
          },
          content: {
            image: post.images?.[0] || '/placeholder-post.svg',
            // TODO: Feed API에 Task 정보 포함 필요 (#197)
            company: '서정 건축',
            duration: '4일 소요',
            timestamp: post.createdAt ? formatRelativeTime(post.createdAt) : '',
            description: post.content ?? '',
          },
        }
      })
      .filter((item): item is FeedItem => item !== null)
  }, [feeds, trade, minExperience, maxExperience, authorId, currentUserId])

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
