'use client'

import { useMemo } from 'react'
import { useGetFeeds, useGetProfiles } from '@bconnect/api-client'
import type { Post, Profile, Trade } from '@bconnect/api-client'
import { DEFAULT_PROFILE_IMAGE } from '@bconnect/config/avatar'
import type { ExperienceLevel } from '@/lib/experience'
import { EXPERIENCE_RANGES } from '@/lib/experience'
import type { Grade } from '@/lib/grade'
import { PROFILE_ROLE_TO_GRADE } from '@/lib/grade'

export interface TechnicianItem {
  profileId: number
  memberId: number
  name: string
  picture: string
  location: string
  primaryTrade?: Trade
  experienceYears: number
  headline: string
  trades: Trade[]
  // 기술자 외 role(업체/건축주/설계)은 직급 없음
  grade?: Grade
  postCount: number
  coworkerCount: number
  recommendCount: number
  // 인증: 타인 프로필 credentials 조회 API 미구현 — 연동 전까진 빈 목록
  certifications: string[]
  // 작업물(Post) 유래 — 소요일은 Feed 에 task 정보가 없어 미표시
  portfolios: { imageUrl: string; daysRequired?: number }[]
}

function toTechnicianItem(profile: Profile, posts: Post[]): TechnicianItem | null {
  const profileId = profile.id
  const memberId = profile.member?.id
  // 프로필/멤버 식별자 없으면 카드 액션(프로필 보기·메시지)이 불가능 — 목록에서 제외
  if (profileId == null || memberId == null) return null

  const name = profile.member?.name ?? ''
  return {
    profileId,
    memberId,
    name,
    picture: profile.member?.picture ?? DEFAULT_PROFILE_IMAGE,
    // BE Address 캐논: city = 도/광역시 (data.sql), 지역 필터 옵션(도 단위)과 매칭
    location: profile.address?.city ?? '',
    primaryTrade: profile.primaryTrade,
    experienceYears: profile.experience ?? 0,
    headline: profile.headline ?? '',
    trades: profile.trades ?? [],
    grade: profile.role ? PROFILE_ROLE_TO_GRADE[profile.role] : undefined,
    postCount: profile.postCount ?? 0,
    coworkerCount: profile.coworkerCount ?? 0,
    recommendCount: profile.recommendationCount ?? 0,
    certifications: [],
    portfolios: posts
      .slice(0, 3)
      .map((post) => ({ imageUrl: post.images?.[0] ?? '', daysRequired: undefined })),
  }
}

interface UseTechnicianItemsOptions {
  trades?: Trade[] | null
  experience?: ExperienceLevel | null
  grades?: Grade[] | null
  regions?: string[] | null
}

export function useTechnicianItems({
  trades,
  experience,
  grades,
  regions,
}: UseTechnicianItemsOptions = {}) {
  const { data, isLoading, error } = useGetProfiles()
  // 포트폴리오(작업물 썸네일)용 — 실패해도 목록은 뜨도록 error 미전파
  const { data: feeds } = useGetFeeds()

  const postsByMember = useMemo(() => {
    const map = new Map<number, Post[]>()
    for (const feed of feeds ?? []) {
      const memberId = feed.member?.id
      if (memberId == null || !feed.post) continue
      const posts = map.get(memberId) ?? []
      posts.push(feed.post)
      map.set(memberId, posts)
    }
    return map
  }, [feeds])

  const allItems = useMemo(
    () =>
      (data ?? []).flatMap(
        (profile) =>
          toTechnicianItem(profile, postsByMember.get(profile.member?.id ?? -1) ?? []) ?? []
      ),
    [data, postsByMember]
  )

  const expRange = experience ? EXPERIENCE_RANGES[experience] : undefined

  const items: TechnicianItem[] = useMemo(() => {
    return allItems.filter((item) => {
      // 공종 다중 선택 — 선택된 공종 중 하나라도 보유하면 통과 (OR)
      if (trades && trades.length > 0 && !trades.some((t) => item.trades.includes(t))) return false
      // 직급 다중 선택 — 선택된 직급 중 하나라도 일치하면 통과 (OR). 직급 없는 프로필은 필터 시 제외
      if (grades && grades.length > 0 && (!item.grade || !grades.includes(item.grade))) return false
      if (expRange != null) {
        if (item.experienceYears < expRange.min) return false
        if (expRange.max != null && item.experienceYears > expRange.max) return false
      }
      // 지역 다중 선택 — 선택된 지역 중 하나라도 매칭되면 통과 (OR 조건)
      if (regions && regions.length > 0 && !regions.some((r) => item.location.includes(r)))
        return false
      return true
    })
  }, [allItems, trades, expRange, grades, regions])

  return { items, totalCount: allItems.length, isLoading, error }
}
