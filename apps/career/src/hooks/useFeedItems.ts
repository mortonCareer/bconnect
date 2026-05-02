'use client'

import { useMemo } from 'react'
import { useGetFeeds } from '@morton/api-client'
import type { Trade } from '@morton/api-client'
import { TRADE_LABELS } from '../lib/trade-labels'
import { formatRelativeTime } from '../lib/format-time'

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
}: UseFeedItemsOptions = {}) {
  const { data: feeds, isLoading, error } = useGetFeeds()

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
          profile: {
            image: member.picture ?? '',
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
  }, [feeds, trade, minExperience, maxExperience, authorId])

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

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    GUEST: '게스트',
    CLIENT: '의뢰인',
    ARCHITECT: '건축사',
    CONTRACTOR: '시공사',
    FOREMAN: '반장',
    SKILLED: '숙련공',
    SEMI_SKILLED: '준숙련공',
    HELPER: '보조',
    ADMIN: '관리자',
  }
  return labels[role] ?? role
}
