import 'server-only'

import { unstable_cache } from 'next/cache'
import type { VerifyBusinessResult, VerifyOwnerResult } from './types'
import { MOCK_VERIFY_RESULT, MOCK_VERIFY_OWNER_RESULT } from './mock-data'

const CACHE_TTL = 3600 // 1시간

/**
 * 사업자등록번호로 전체 조회 (서버 전용)
 *
 * - 사업자번호별로 1시간 캐싱 (unstable_cache)
 * - 동일 번호 재조회 시 캐시 히트 → 외부 API 호출 절약
 *
 * TODO: 실제 외부 API 연동 시 Promise.allSettled()로 병렬 호출 후 집계
 * - 국세청 사업자상태 조회 (data.go.kr)
 * - KISCON 건설업체 조회 (data.go.kr)
 * - 고용노동부 임금체불 명단 (고용24 API)
 * - 근로복지공단 고용/산재보험 (data.go.kr)
 * - 기타 웹 조회/파일 데이터
 */
async function _fetchBusinessVerification(
  registrationNumber: string
): Promise<VerifyBusinessResult> {
  // Mock: 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 실제 구현 시 registrationNumber로 외부 API 호출
  // const results = await Promise.allSettled([
  //   fetchBusinessStatus(registrationNumber),
  //   fetchConstructionLicense(registrationNumber),
  //   ...
  // ])

  return {
    ...MOCK_VERIFY_RESULT,
    company: {
      ...MOCK_VERIFY_RESULT.company,
      registrationNumber: `${registrationNumber.slice(0, 3)}-${registrationNumber.slice(3, 5)}-${registrationNumber.slice(5)}`,
    },
  }
}

export const fetchBusinessVerification = unstable_cache(
  _fetchBusinessVerification,
  ['one-click-verify'],
  { revalidate: CACHE_TTL }
)

/**
 * 사업자 진위확인 (서버 전용)
 *
 * TODO: 국세청 진위확인 API 연동
 */
export async function fetchOwnerVerification(
  _registrationNumber: string,
  _ownerName: string,
  _openDate: string
): Promise<VerifyOwnerResult> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Mock 응답
  return MOCK_VERIFY_OWNER_RESULT
}
