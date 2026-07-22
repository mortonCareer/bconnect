'use client'

import { useMemo } from 'react'
import {
  postImageUrls,
  regionOfCrawled,
  regionOfState,
  useGetCrawledMembers,
  useGetFeeds,
  useGetProfiles,
} from '@bconnect/api-client'
import type { CrawledMemberSummary, Post, Profile, Region, Trade } from '@bconnect/api-client'
import { DEFAULT_PROFILE_IMAGE } from '@bconnect/config/avatar'
import { toCrawledDisplay } from '@/lib/crawled'
import type { ExperienceLevel } from '@/lib/experience'
import { EXPERIENCE_RANGES } from '@/lib/experience'
import type { Grade } from '@/lib/grade'
import { PROFILE_ROLE_TO_GRADE } from '@/lib/grade'

interface TechnicianItemBase {
  name: string
  picture: string
  location: string
  // 표시용 location 과 분리 — 비교는 코드로, 표시는 문자열로. 미상(주소 없음·해석 실패)이면 undefined
  region?: Region
  primaryTrade?: Trade
  // 미상(크롤링 미추출)이면 undefined — 경력 필터에서 제외
  experienceYears?: number
  headline: string
  trades: Trade[]
  // 기술자 외 role(업체/건축주/설계)은 직급 없음
  grade?: Grade
  postCount: number
  coworkerCount: number
  recommendCount: number
  // ⚠️ 모킹값 — 리뷰(별점)·계약·인증 BE 도메인 미구현. 0/빈값은 실제 발생 가능해 sentinel 로 모킹 명시
  rating: number
  reviewCount: number
  contractCount: number
  certifications: string[]
  // 작업물(Post) 유래 — 소요일은 Feed 에 task 정보가 없어 미표시
  portfolios: { imageUrl: string; daysRequired?: number }[]
}

/** 가입 회원 프로필 카드 — 프로필 패널·메시지 등 회원 동작 가능 */
export interface MemberTechnicianItem extends TechnicianItemBase {
  source: 'member'
  profileId: number
  memberId: number
  // 회원 프로필은 BE 가 경력을 항상 채움 (미상 없음)
  experienceYears: number
}

/** 크롤링 프로필 카드 — 전시 전용 (전화·출처 링크만 가능) */
export interface CrawledTechnicianItem extends TechnicianItemBase {
  source: 'crawled'
  crawledId: number
  phone: string
  sourceUrl: string
  /** 업체명 — 표시명(name)이 대표자명일 때 메타에 병기 */
  company: string
}

export type TechnicianItem = MemberTechnicianItem | CrawledTechnicianItem

function toTechnicianItem(profile: Profile, posts: Post[]): MemberTechnicianItem | null {
  const profileId = profile.id
  const memberId = profile.member?.id
  // 프로필/멤버 식별자 없으면 카드 액션(프로필 보기·메시지)이 불가능 — 목록에서 제외
  if (profileId == null || memberId == null) return null

  const name = profile.member?.name ?? ''
  return {
    source: 'member',
    profileId,
    memberId,
    name,
    picture: profile.member?.picture ?? DEFAULT_PROFILE_IMAGE,
    // 주소 저장 규칙(mapKakaoAddress): city = 시/군/구(표시), state = 시/도(필터 비교)
    location: profile.address?.city ?? '',
    region: regionOfState(profile.address?.state),
    primaryTrade: profile.primaryTrade,
    experienceYears: profile.experience ?? 0,
    headline: profile.headline ?? '',
    trades: profile.trades ?? [],
    grade: profile.role ? PROFILE_ROLE_TO_GRADE[profile.role] : undefined,
    postCount: profile.postCount ?? 0,
    coworkerCount: profile.coworkerCount ?? 0,
    recommendCount: profile.recommendationCount ?? 0,
    // ⚠️ 모킹값 (BE 도메인 미구현) — 0은 실제 발생 가능한 값이라 sentinel 로 모킹임을 명시.
    // rating 은 5점 초과 불가 → 2.5 고정.
    rating: 2.5,
    reviewCount: 777,
    contractCount: 777,
    certifications: [],
    portfolios: posts
      .slice(0, 3)
      .map((post) => ({ imageUrl: postImageUrls(post)[0] ?? '', daysRequired: undefined })),
  }
}

function toCrawledItem(crawled: CrawledMemberSummary): CrawledTechnicianItem | null {
  const crawledId = crawled.id
  if (crawledId == null) return null

  const d = toCrawledDisplay(crawled)
  return {
    source: 'crawled',
    crawledId,
    name: d.displayName,
    picture: crawled.picture ?? DEFAULT_PROFILE_IMAGE,
    location: d.location,
    region: crawled.profile?.state ? regionOfCrawled(crawled.profile.state) : undefined,
    primaryTrade: d.primaryTrade,
    experienceYears: d.experienceYears,
    headline: d.headline,
    trades: d.trades,
    grade: d.grade,
    postCount: 0,
    coworkerCount: 0,
    recommendCount: 0,
    rating: 0,
    reviewCount: 0,
    contractCount: 0,
    certifications: [],
    // 목록 API 에는 시공 사진이 없음 — 상세 패널에서 posts 로 표시
    portfolios: [],
    phone: d.phone,
    sourceUrl: d.sourceUrl,
    company: crawled.company ?? '',
  }
}

interface UseTechnicianItemsOptions {
  trades?: Trade[] | null
  experience?: ExperienceLevel | null
  grades?: Grade[] | null
  regions?: Region[] | null
}

export function useTechnicianItems({
  trades,
  experience,
  grades,
  regions,
}: UseTechnicianItemsOptions = {}) {
  const { data, isLoading: isMembersLoading, error } = useGetProfiles()
  // 포트폴리오(작업물 썸네일)용 — 실패해도 목록은 뜨도록 error 미전파
  const { data: feeds } = useGetFeeds()
  // 크롤링 프로필 — 회원 목록 뒤에 병합. 실패해도 회원 목록은 뜨도록 error 미전파
  const { data: crawledMembers, isLoading: isCrawledLoading } = useGetCrawledMembers()
  // 두 소스가 다 도착해야 목록 확정 — 회원만 먼저 끝나 크롤링 카드가 late append 되며
  // 빈 상태가 번쩍이는 것을 방지 (error 는 회원 쿼리만 전파)
  const isLoading = isMembersLoading || isCrawledLoading

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

  // 가입 회원이 항상 앞, 크롤링 프로필이 뒤 — 가입 유인 유지
  const allItems: TechnicianItem[] = useMemo(
    () => [
      ...(data ?? []).flatMap(
        (profile) =>
          toTechnicianItem(profile, postsByMember.get(profile.member?.id ?? -1) ?? []) ?? []
      ),
      ...(crawledMembers ?? []).flatMap((crawled) => toCrawledItem(crawled) ?? []),
    ],
    [data, postsByMember, crawledMembers]
  )

  const expRange = experience ? EXPERIENCE_RANGES[experience] : undefined

  const items: TechnicianItem[] = useMemo(() => {
    return allItems.filter((item) => {
      // 공종 다중 선택 — 선택된 공종 중 하나라도 보유하면 통과 (OR)
      if (trades && trades.length > 0 && !trades.some((t) => item.trades.includes(t))) return false
      // 직급 다중 선택 — 선택된 직급 중 하나라도 일치하면 통과 (OR). 직급 없는 프로필은 필터 시 제외
      if (grades && grades.length > 0 && (!item.grade || !grades.includes(item.grade))) return false
      if (expRange != null) {
        // 경력 미상(크롤링 미추출)은 경력 필터 선택 시 제외 — 직급 필터의 미상 제외와 동일 규칙
        if (item.experienceYears == null) return false
        if (item.experienceYears < expRange.min) return false
        if (expRange.max != null && item.experienceYears > expRange.max) return false
      }
      // 지역 다중 선택 — 선택된 지역 중 하나라도 일치하면 통과 (OR). 지역 미상은 필터 시 제외
      if (regions && regions.length > 0 && (!item.region || !regions.includes(item.region)))
        return false
      return true
    })
  }, [allItems, trades, expRange, grades, regions])

  // 가입 회원 수만 별도 노출 — GuestSidebar '검증된 프로필 N명' 카피는 크롤링 제외
  const memberCount = useMemo(
    () => allItems.reduce((n, item) => (item.source === 'member' ? n + 1 : n), 0),
    [allItems]
  )

  return { items, totalCount: allItems.length, memberCount, isLoading, error }
}
