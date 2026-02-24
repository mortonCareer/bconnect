import 'server-only'

import { XMLParser } from 'fast-xml-parser'
import type { KcomwelInsuranceItem } from './types'

const KCOMWEL_INSURANCE_URL =
  'https://apis.data.go.kr/B490001/gySjbPstateInfoService/getGySjBoheomBsshItem'

const xmlParser = new XMLParser({
  // "00" → 0 변환 방지, 사업자번호·날짜 등 문자열 유지
  parseTagValue: false,
})

function getServiceKey(): string {
  const key = process.env.KCOMWEL_API_SERVICE_KEY
  if (!key) {
    throw new Error('KCOMWEL_API_SERVICE_KEY is not configured')
  }
  return key
}

/**
 * 근로복지공단 고용/산재보험 가입 사업장 조회 (XML 응답 → 파싱)
 *
 * @param registrationNumber 사업자등록번호 (10자리, 하이픈 없음)
 * @returns 가입 사업장 항목 배열 (없으면 빈 배열)
 */
export async function fetchKcomwelInsurance(
  registrationNumber: string
): Promise<KcomwelInsuranceItem[]> {
  const url = new URL(KCOMWEL_INSURANCE_URL)
  url.searchParams.set('serviceKey', getServiceKey())
  url.searchParams.set('v_saeopjaDrno', registrationNumber)
  url.searchParams.set('numOfRows', '10')
  url.searchParams.set('pageNo', '1')

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Kcomwel insurance API error: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  const parsed = xmlParser.parse(text)

  const header = parsed?.response?.header
  if (header?.resultCode !== '00') {
    throw new Error(`Kcomwel API error: ${header?.resultCode} ${header?.resultMsg}`)
  }

  const body = parsed?.response?.body
  if (!body?.items?.item) return []

  // data.go.kr: 단건=object, 복수=array
  const items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]
  return items as KcomwelInsuranceItem[]
}
