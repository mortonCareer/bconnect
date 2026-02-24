import 'server-only'

import { unstable_cache } from 'next/cache'
import type { CheckItem, NtsStatusItem, VerifyBusinessResult, VerifyOwnerResult } from './types'
import { MOCK_VERIFY_RESULT } from './mock-data'
import { fetchNtsBusinessStatus, fetchNtsBusinessValidate } from './nts-client'

const CACHE_TTL = 3600 // 1시간

// ─── NTS Status → CheckItem 변환 ────────────────────

function resolveBusinessStatus(sttCd: string): {
  status: string
  statusType: CheckItem['statusType']
} {
  switch (sttCd) {
    case '01':
      return { status: '정상 운영', statusType: 'positive' }
    case '02':
      return { status: '휴업', statusType: 'negative' }
    case '03':
      return { status: '폐업', statusType: 'negative' }
    default:
      return { status: '상태 확인 불가', statusType: 'neutral' }
  }
}

function formatRegNo(bNo: string): string {
  if (bNo.length !== 10) return bNo
  return `${bNo.slice(0, 3)}-${bNo.slice(3, 5)}-${bNo.slice(5)}`
}

function mapNtsStatusToCheckItem(item: NtsStatusItem): CheckItem {
  const { status, statusType } = resolveBusinessStatus(item.b_stt_cd)

  return {
    id: 'BUSINESS_STATUS',
    category: 'BUSINESS_LICENSE',
    label: '사업자 상태',
    source: '국세청',
    status,
    statusType,
    description: '국세청 기준 현재 영업 상태를 확인해요.',
    details: [
      { key: '사업자등록번호', value: formatRegNo(item.b_no) },
      { key: '납세자상태', value: item.b_stt || '-' },
      { key: '과세유형', value: item.tax_type || '-' },
      ...(item.end_dt
        ? [
            {
              key: '폐업일',
              value: `${item.end_dt.slice(0, 4)}.${item.end_dt.slice(4, 6)}.${item.end_dt.slice(6)}`,
            },
          ]
        : []),
    ],
  }
}

function makeBusinessStatusErrorItem(registrationNumber: string): CheckItem {
  return {
    id: 'BUSINESS_STATUS',
    category: 'BUSINESS_LICENSE',
    label: '사업자 상태',
    source: '국세청',
    status: '조회 실패',
    statusType: 'error',
    description: '국세청 API 조회에 실패했습니다. 잠시 후 다시 시도해주세요.',
    details: [{ key: '사업자등록번호', value: formatRegNo(registrationNumber) }],
  }
}

// ─── 사업자 통합 조회 ───────────────────────────────

/**
 * 사업자등록번호로 전체 조회 (서버 전용)
 *
 * - BUSINESS_STATUS: 국세청 상태조회 API (실제)
 * - 나머지 9개: mock 데이터 (추후 API 연동 예정)
 * - 사업자번호별 1시간 캐싱 (unstable_cache)
 */
async function _fetchBusinessVerification(
  registrationNumber: string
): Promise<VerifyBusinessResult> {
  // 1) 국세청 상태조회 (실패 시 error CheckItem)
  let businessStatusItem: CheckItem
  try {
    const ntsResponse = await fetchNtsBusinessStatus([registrationNumber])
    const ntsItem = ntsResponse.data?.[0]
    if (!ntsItem) throw new Error('NTS returned empty data')
    businessStatusItem = mapNtsStatusToCheckItem(ntsItem)
  } catch (error) {
    console.error('NTS business status API failed:', error)
    businessStatusItem = makeBusinessStatusErrorItem(registrationNumber)
  }

  // 2) 나머지 9개는 mock 유지
  const mockItems = MOCK_VERIFY_RESULT.checkItems.filter((item) => item.id !== 'BUSINESS_STATUS')

  return {
    company: {
      ...MOCK_VERIFY_RESULT.company,
      registrationNumber: formatRegNo(registrationNumber),
    },
    checkItems: [businessStatusItem, ...mockItems],
  }
}

export const fetchBusinessVerification = unstable_cache(
  _fetchBusinessVerification,
  ['one-click-verify'],
  { revalidate: CACHE_TTL }
)

// ─── 사업자 진위확인 ────────────────────────────────

/**
 * 국세청 사업자 진위확인 (서버 전용)
 * 캐시 없음 — 매번 다른 입력(대표자명, 개업일자)이므로
 */
export async function fetchOwnerVerification(
  registrationNumber: string,
  ownerName: string,
  openDate: string
): Promise<VerifyOwnerResult> {
  try {
    const response = await fetchNtsBusinessValidate(registrationNumber, ownerName, openDate)
    const item = response.data?.[0]

    if (!item) {
      return { valid: false, message: '진위확인 결과를 받지 못했습니다.' }
    }

    return {
      valid: item.valid === '01',
      message:
        item.valid_msg ||
        (item.valid === '01'
          ? '사업자등록번호와 대표자명, 개업일자가 일치합니다.'
          : '입력하신 정보가 등록된 정보와 일치하지 않습니다.'),
    }
  } catch (error) {
    console.error('NTS validate API failed:', error)
    return { valid: false, message: '진위확인에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
}
