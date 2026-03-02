import 'server-only'

import type { NtsStatusResponse, NtsValidateResponse } from './types'

const NTS_STATUS_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/status'
const NTS_VALIDATE_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/validate'

function getServiceKey(): string {
  const key = process.env.NTS_API_SERVICE_KEY
  if (!key) {
    throw new Error('NTS_API_SERVICE_KEY is not configured')
  }
  return key
}

/**
 * 국세청 사업자등록정보 상태조회
 *
 * @test positive 6138127726 → 정상 운영 (b_stt_cd=01) (2026-02-28)
 * @test negative 5158511710 → 폐업 (b_stt_cd=03) (2026-02-28)
 * @throws network error, non-2xx, missing env
 */
export async function fetchNtsBusinessStatus(
  registrationNumbers: string[]
): Promise<NtsStatusResponse> {
  const url = new URL(NTS_STATUS_URL)
  url.searchParams.set('serviceKey', getServiceKey())

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ b_no: registrationNumbers }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`NTS status API error: ${response.status} ${response.statusText} - ${body}`)
  }

  return response.json() as Promise<NtsStatusResponse>
}

/**
 * 국세청 사업자등록정보 진위확인
 *
 * @throws network error, non-2xx, missing env
 */
export async function fetchNtsBusinessValidate(
  registrationNumber: string,
  ownerName: string,
  openDate: string
): Promise<NtsValidateResponse> {
  const url = new URL(NTS_VALIDATE_URL)
  url.searchParams.set('serviceKey', getServiceKey())

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businesses: [
        {
          b_no: registrationNumber,
          start_dt: openDate.replace(/\D/g, ''),
          p_nm: ownerName,
        },
      ],
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`NTS validate API error: ${response.status} ${response.statusText} - ${body}`)
  }

  return response.json() as Promise<NtsValidateResponse>
}
