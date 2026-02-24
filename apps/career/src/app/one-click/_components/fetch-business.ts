import 'server-only'

import { unstable_cache } from 'next/cache'
import type {
  CheckItem,
  KcomwelInsuranceItem,
  NtsStatusItem,
  VerifyBusinessResult,
  VerifyOwnerResult,
  WageArrearsResponse,
} from './types'
import { MOCK_VERIFY_RESULT } from './mock-data'
import { fetchNtsBusinessStatus, fetchNtsBusinessValidate } from './nts-client'
import { fetchKcomwelInsurance } from './kcomwel-client'
import { fetchWageArrears } from './work24-client'

const CACHE_TTL = 3600 // 1시간

// ─── 헬퍼 ────────────────────────────────────────

function formatRegNo(bNo: string): string {
  if (bNo.length !== 10) return bNo
  return `${bNo.slice(0, 3)}-${bNo.slice(3, 5)}-${bNo.slice(5)}`
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr || dateStr.length !== 8) return dateStr || '-'
  return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6)}`
}

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

// ─── Kcomwel Insurance → CheckItem 변환 ──────────────

function mapKcomwelToCheckItem(items: KcomwelInsuranceItem[]): CheckItem {
  const hasRecords = items.length > 0
  const firstItem = items[0]

  return {
    id: 'EMPLOYMENT_INSURANCE',
    category: 'INSURANCE',
    label: '고용/산재보험 현황',
    source: '근로복지공단',
    status: hasRecords ? '확인' : '미확인',
    statusType: hasRecords ? 'positive' : 'neutral',
    description: '근로복지공단에 등록된 보험 가입 현황이에요.',
    details: hasRecords
      ? [
          { key: '사업장명', value: firstItem.saeopjangNm || '-' },
          { key: '업종', value: firstItem.sjEopjongNm || firstItem.gyEopjongNm || '-' },
          {
            key: '상시근로자수',
            value: firstItem.sangsiInwonCnt ? `${firstItem.sangsiInwonCnt}명` : '-',
          },
          { key: '성립일자', value: formatDate(String(firstItem.seongripDt)) },
          { key: '소재지', value: firstItem.addr || '-' },
        ]
      : [],
  }
}

function makeInsuranceErrorItem(): CheckItem {
  return {
    id: 'EMPLOYMENT_INSURANCE',
    category: 'INSURANCE',
    label: '고용/산재보험 현황',
    source: '근로복지공단',
    status: '조회 실패',
    statusType: 'error',
    description: '근로복지공단 API 조회에 실패했습니다. 잠시 후 다시 시도해주세요.',
    details: [],
  }
}

// ─── Work24 Wage Arrears → CheckItem 변환 (구조만) ────

function mapWageArrearsToCheckItem(response: WageArrearsResponse): CheckItem {
  const totalCount = response.response?.body?.totalCount ?? 0
  const hasArrears = totalCount > 0

  return {
    id: 'WAGE_ARREARS',
    category: 'WAGE_RESTRICTION',
    label: '임금체불 이력',
    source: '고용노동부',
    status: hasArrears ? `${totalCount}건 확인` : '해당 없음',
    statusType: hasArrears ? 'negative' : 'positive',
    description: '고용노동부 공표 체불사업주 명단이에요.',
    details: [], // API 승인 후 상세 정보 추가
  }
}

function makeWageArrearsErrorItem(): CheckItem {
  return {
    id: 'WAGE_ARREARS',
    category: 'WAGE_RESTRICTION',
    label: '임금체불 이력',
    source: '고용노동부',
    status: '조회 실패',
    statusType: 'error',
    description: '고용24 API 조회에 실패했습니다. 잠시 후 다시 시도해주세요.',
    details: [],
  }
}

// ─── 사업자 통합 조회 ───────────────────────────────

/** 실제 API로 연결된 항목 ID (mock에서 제외할 목록) */
const REAL_API_ITEM_IDS = new Set(['BUSINESS_STATUS', 'EMPLOYMENT_INSURANCE'])

/**
 * 사업자등록번호로 전체 조회 (서버 전용)
 *
 * - BUSINESS_STATUS: 국세청 상태조회 API
 * - EMPLOYMENT_INSURANCE: 근로복지공단 고용/산재보험 API
 * - WAGE_ARREARS: 고용24 API (env var 있을 때만, 없으면 mock)
 * - 나머지: mock 데이터
 * - 사업자번호별 1시간 캐싱 (unstable_cache)
 */
async function _fetchBusinessVerification(
  registrationNumber: string
): Promise<VerifyBusinessResult> {
  // 1) NTS + KCOMWEL 병렬 호출
  const [ntsResult, kcomwelResult] = await Promise.allSettled([
    fetchNtsBusinessStatus([registrationNumber]),
    fetchKcomwelInsurance(registrationNumber),
  ])

  // 2) NTS → BUSINESS_STATUS
  let businessStatusItem: CheckItem
  if (ntsResult.status === 'fulfilled' && ntsResult.value.data?.[0]) {
    businessStatusItem = mapNtsStatusToCheckItem(ntsResult.value.data[0])
  } else {
    const reason = ntsResult.status === 'rejected' ? ntsResult.reason : 'empty data'
    console.error('NTS business status API failed:', reason)
    businessStatusItem = makeBusinessStatusErrorItem(registrationNumber)
  }

  // 3) KCOMWEL → EMPLOYMENT_INSURANCE
  let insuranceItem: CheckItem
  let companyName: string | undefined
  if (kcomwelResult.status === 'fulfilled') {
    const kcomwelItems = kcomwelResult.value
    insuranceItem = mapKcomwelToCheckItem(kcomwelItems)
    if (kcomwelItems.length > 0 && kcomwelItems[0].saeopjangNm) {
      companyName = kcomwelItems[0].saeopjangNm
    }
  } else {
    console.error('Kcomwel insurance API failed:', kcomwelResult.reason)
    insuranceItem = makeInsuranceErrorItem()
  }

  // 4) WAGE_ARREARS: env var 없으면 mock 유지 (silent)
  const realItemsExclude = new Set(REAL_API_ITEM_IDS)
  let wageArrearsItem: CheckItem | undefined
  if (process.env.WORK24_API_SERVICE_KEY) {
    try {
      const wageResult = await fetchWageArrears(registrationNumber)
      wageArrearsItem = mapWageArrearsToCheckItem(wageResult)
      realItemsExclude.add('WAGE_ARREARS')
    } catch (error) {
      console.error('Work24 wage arrears API failed:', error)
      wageArrearsItem = makeWageArrearsErrorItem()
      realItemsExclude.add('WAGE_ARREARS')
    }
  }

  // 5) 실제 연결된 항목을 Map에 모으고, mock 순서 기준으로 조합
  const realItems = new Map<string, CheckItem>([
    ['BUSINESS_STATUS', businessStatusItem],
    ['EMPLOYMENT_INSURANCE', insuranceItem],
  ])
  if (wageArrearsItem) {
    realItems.set('WAGE_ARREARS', wageArrearsItem)
  }

  const checkItems = MOCK_VERIFY_RESULT.checkItems.map(
    (mockItem) => realItems.get(mockItem.id) ?? mockItem
  )

  return {
    company: {
      name: companyName ?? MOCK_VERIFY_RESULT.company.name,
      registrationNumber: formatRegNo(registrationNumber),
    },
    checkItems,
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
