'use client'

import { useMemo } from 'react'
import { useGetProfiles } from '@bconnect/api-client'
import type { Trade } from '@bconnect/api-client'
// TODO: BE #211 구현 후 fixture import 제거하고 generated 응답을 직접 매핑하도록 복원.
import { TECHNICIAN_FIXTURES } from '@/lib/fixtures/technicians'
import type { ExperienceLevel } from '@/lib/experience'
import { EXPERIENCE_RANGES } from '@/lib/experience'
import type { Grade } from '@/lib/grade'

export interface TechnicianItem {
  profileId: number
  memberId: number
  name: string
  picture: string
  location: string
  primaryTrade: Trade
  experienceYears: number
  headline: string
  trades: Trade[]
  // TODO: BE #211 구현 후 실데이터 교체
  grade: Grade
  rating: number
  reviewCount: number
  contractCount: number
  postCount: number
  coworkerCount: number
  recommendCount: number
  certifications: string[]
  portfolios: { imageUrl: string; daysRequired: number }[]
}

interface UseTechnicianItemsOptions {
  trades?: Trade[] | null
  experience?: ExperienceLevel | null
  grades?: Grade[] | null
  regions?: string[] | null
}

export function useTechnicianItems({
  trade,
  experience,
  grade,
  region,
}: UseTechnicianItemsOptions = {}) {
  // useGetProfiles 호출은 유지 — loading/error state 와 BE 연동 경로 보존.
  // TODO: BE #211 구현 후 응답(`data`)을 매핑해서 items 생성하도록 복원.
  const { isLoading, error } = useGetProfiles()

  const expRange = experience ? EXPERIENCE_RANGES[experience] : undefined

  const items: TechnicianItem[] = useMemo(() => {
    return TECHNICIAN_FIXTURES.filter((item) => {
      // 공종 다중 선택 — 선택된 공종 중 하나라도 보유하면 통과 (OR)
      if (trade && trade.length > 0 && !trade.some((t) => item.trades.includes(t))) return false
      // 직급 다중 선택 — 선택된 직급 중 하나라도 일치하면 통과 (OR)
      if (grade && grade.length > 0 && !grade.includes(item.grade)) return false
      if (expRange != null) {
        if (item.experienceYears < expRange.min) return false
        if (expRange.max != null && item.experienceYears > expRange.max) return false
      }
      // 지역 다중 선택 — 선택된 지역 중 하나라도 매칭되면 통과 (OR 조건)
      if (region && region.length > 0 && !region.some((r) => item.location.includes(r)))
        return false
      return true
    })
  }, [trade, expRange, grade, region])

  return { items, totalCount: TECHNICIAN_FIXTURES.length, isLoading, error }
}
