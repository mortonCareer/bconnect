import 'server-only'

import type { WageArrearsResponse } from './types'

// 고용24 임금체불 공표 API (승인 필요)
// TODO: 실제 엔드포인트 확정 후 교체
const WORK24_WAGE_ARREARS_URL = 'https://openapi.work24.go.kr/tbd/wageArrears'

function getServiceKey(): string {
  const key = process.env.WORK24_API_SERVICE_KEY
  if (!key) {
    throw new Error('WORK24_API_SERVICE_KEY is not configured')
  }
  return key
}

/**
 * 고용24 임금체불 공표 명단 조회
 *
 * 현재 API 접근 승인 대기 중. 승인 후 엔드포인트/파라미터 확정 필요.
 *
 * @param registrationNumber 사업자등록번호 (10자리, 하이픈 없음)
 * @throws network error, non-2xx, missing env
 */
export async function fetchWageArrears(registrationNumber: string): Promise<WageArrearsResponse> {
  const url = new URL(WORK24_WAGE_ARREARS_URL)
  url.searchParams.set('serviceKey', getServiceKey())
  url.searchParams.set('bizNo', registrationNumber) // TODO: 파라미터명 확정 후 교체
  url.searchParams.set('returnType', 'JSON')

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Work24 wage arrears API error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<WageArrearsResponse>
}
