'use client'

import { useMemo } from 'react'
import { useGetProfiles } from '@bconnect/api-client'
import type { Trade } from '@bconnect/api-client'
// TODO: BE #211 구현 후 fixture import 제거하고 generated 응답을 직접 매핑하도록 복원.
import { TECHNICIAN_FIXTURES } from '@/lib/fixtures/technicians'
import type { ExperienceLevel } from '@/lib/experience'
import { EXPERIENCE_RANGES } from '@/lib/experience'

export interface TechnicianItem {
  profileId: number
  memberId: number
  name: string
  picture: string
  location: string
  primaryTrade: string
  experienceYears: number
  headline: string
  trades: Trade[]
  // TODO: BE #211 구현 후 실데이터 교체
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
  trade?: Trade | null
  experience?: ExperienceLevel | null
  region?: string | null
}

export function useTechnicianItems({ trade, experience, region }: UseTechnicianItemsOptions = {}) {
  // useGetProfiles 호출은 유지 — loading/error state 와 BE 연동 경로 보존.
  // TODO: BE #211 구현 후 응답(`data`)을 매핑해서 items 생성하도록 복원.
  const { isLoading, error } = useGetProfiles()

  const expRange = experience ? EXPERIENCE_RANGES[experience] : undefined

  const items: TechnicianItem[] = useMemo(() => {
    return TECHNICIAN_FIXTURES.filter((item) => {
      if (trade && !item.trades.includes(trade)) return false
      if (expRange != null) {
        if (item.experienceYears < expRange.min) return false
        if (expRange.max != null && item.experienceYears > expRange.max) return false
      }
      if (region && region !== '전체' && !item.location.includes(region)) return false
      return true
    })
  }, [trade, expRange, region])

  return { items, totalCount: TECHNICIAN_FIXTURES.length, isLoading, error }
}
