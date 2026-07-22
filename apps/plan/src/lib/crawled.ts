import { REGION_LABELS, regionOfCrawled } from '@bconnect/api-client'
import type { CrawledMember, CrawledMemberSummary, Trade } from '@bconnect/api-client'
import { GRADE_VALUES, type Grade } from './grade'

/**
 * 크롤링 프로필의 카드·상세 패널 공용 표시 파생.
 *
 * 목록/상세 두 뷰가 같은 규칙(대표자명 우선, 업체명 병기, enum→라벨)을 공유하도록 단일 함수로 통합.
 * trades·primaryTrade 는 크롤러(#826)가 BE Trade enum 코드로 저장하므로 FE 역매핑 없이 그대로 소비.
 */
export interface CrawledDisplay {
  /** 실회원 name(사람 이름) 슬롯과 정합: 대표자명 우선, 없으면 업체명 폴백 */
  displayName: string
  /** 표시명이 대표자명일 때 메타에 병기할 업체명 (폴백 표시 중이면 null) */
  companySub: string | null
  location: string
  trades: Trade[]
  primaryTrade?: Trade
  grade?: Grade
  /** 미추출이면 undefined — 경력 필터에서 '미상'으로 취급 */
  experienceYears?: number
  headline: string
  phone: string
  sourceUrl: string
}

export function toCrawledDisplay(crawled: CrawledMemberSummary | CrawledMember): CrawledDisplay {
  const profile = crawled.profile
  const displayName = crawled.name || crawled.company || ''
  const role = crawled.role ?? ''
  const trades = (profile?.trades ?? []) as Trade[]
  const primaryTrade = profile?.primaryTrade ? (profile.primaryTrade as Trade) : undefined
  // 대표 공종을 태그 정렬 맨 앞으로 (BE trades 는 set 이라 순서 미보장)
  const sortedTrades =
    primaryTrade && trades.includes(primaryTrade)
      ? [primaryTrade, ...trades.filter((t) => t !== primaryTrade)]
      : trades
  return {
    displayName,
    companySub: crawled.company && crawled.company !== displayName ? crawled.company : null,
    location: profile?.state ? (REGION_LABELS[regionOfCrawled(profile.state)] ?? '') : '',
    trades: sortedTrades,
    primaryTrade,
    grade: (GRADE_VALUES as readonly string[]).includes(role) ? (role as Grade) : undefined,
    experienceYears: profile?.experience ?? undefined,
    headline: profile?.headline ?? '',
    phone: crawled.phone ?? '',
    sourceUrl: profile?.url ?? '',
  }
}
