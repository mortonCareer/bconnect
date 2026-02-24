import 'server-only'

import { unstable_cache } from 'next/cache'
import type {
  CheckItem,
  CheckItemId,
  KcomwelInsuranceItem,
  NtsStatusItem,
  VerifyBusinessResult,
  VerifyOwnerResult,
} from './types'
import { MOCK_VERIFY_RESULT } from './mock-data'
import { fetchNtsBusinessStatus, fetchNtsBusinessValidate } from './nts-client'
import { fetchKcomwelInsurance } from './kcomwel-client'
import { fetchFeiaCompanies } from './feia-client'
import { fetchMoelDefaulters } from './moel-client'
import { fetchKisconArrears, fetchKisconSubconLimit } from './kiscon-crawl-client'

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

function makeErrorItem(
  id: CheckItemId,
  category: CheckItem['category'],
  label: string,
  source: string
): CheckItem {
  return {
    id,
    category,
    label,
    source,
    status: '조회 실패',
    statusType: 'error',
    description: `${source} 조회에 실패했습니다. 잠시 후 다시 시도해주세요.`,
    details: [],
  }
}

// ─── Kcomwel Insurance → CheckItem ──────────────────

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

// ─── FEIA → FIRE_LICENSE CheckItem ──────────────────

function mapFeiaToCheckItem(items: Awaited<ReturnType<typeof fetchFeiaCompanies>>): CheckItem {
  const hasRecords = items.length > 0
  const first = items[0]

  return {
    id: 'FIRE_LICENSE',
    category: 'BUSINESS_LICENSE',
    label: '소방시설업 면허',
    source: '한국소방시설협회',
    status: hasRecords ? '확인' : '미확인',
    statusType: hasRecords ? 'positive' : 'neutral',
    description: '한국소방시설협회 기준 소방시설업 면허 등록 현황이에요.',
    details: hasRecords
      ? [
          { key: '업체명', value: first.entprsNameHangul || '-' },
          { key: '대표자', value: first.ceoName || '-' },
          { key: '주소', value: first.hdOffcAddr1 || '-' },
          { key: '등록번호', value: first.licenseName || '-' },
          { key: '구분', value: first.licenseDiv || '-' },
        ]
      : [],
  }
}

// ─── MOEL → WAGE_ARREARS CheckItem ─────────────────

function mapMoelToCheckItem(items: Awaited<ReturnType<typeof fetchMoelDefaulters>>): CheckItem {
  const hasArrears = items.length > 0

  return {
    id: 'WAGE_ARREARS',
    category: 'WAGE_RESTRICTION',
    label: '임금체불 이력',
    source: '고용노동부',
    status: hasArrears ? `${items.length}건 확인` : '해당 없음',
    statusType: hasArrears ? 'negative' : 'positive',
    description: '고용노동부 공표 체불사업주 명단이에요.',
    details: hasArrears
      ? [
          { key: '사업장명', value: items[0].companyName || '-' },
          { key: '대표자', value: items[0].name || '-' },
          { key: '체불액', value: items[0].arrearsAmount ? `${items[0].arrearsAmount}만원` : '-' },
          { key: '업종', value: items[0].industry || '-' },
          { key: '소재지', value: items[0].companyAddress || '-' },
        ]
      : [],
  }
}

// ─── KISCON 상습체불 → HABITUAL_ARREARS CheckItem ────

function mapKisconArrearsToCheckItem(
  items: Awaited<ReturnType<typeof fetchKisconArrears>>
): CheckItem {
  const hasArrears = items.length > 0

  return {
    id: 'HABITUAL_ARREARS',
    category: 'WAGE_RESTRICTION',
    label: '상습체불 이력',
    source: '국토교통부',
    status: hasArrears ? `${items.length}건 확인` : '해당 없음',
    statusType: hasArrears ? 'negative' : 'positive',
    description: '국토교통부 공표 상습체불 명단이에요.',
    details: hasArrears
      ? [
          { key: '업체명', value: items[0].companyName || '-' },
          { key: '대표자', value: items[0].representative || '-' },
          {
            key: '체불금액',
            value: items[0].arrearsAmount ? `${items[0].arrearsAmount}천원` : '-',
          },
          { key: '처분이력', value: items[0].penaltyHistory || '-' },
          { key: '공표기간', value: items[0].publicationPeriod || '-' },
        ]
      : [],
  }
}

// ─── KISCON 하도급 → SUBCONTRACT_RESTRICTION CheckItem ─

function mapKisconSubconToCheckItem(
  items: Awaited<ReturnType<typeof fetchKisconSubconLimit>>
): CheckItem {
  const hasRestriction = items.length > 0

  return {
    id: 'SUBCONTRACT_RESTRICTION',
    category: 'WAGE_RESTRICTION',
    label: '하도급 참여제한',
    source: '국토교통부',
    status: hasRestriction ? `${items.length}건 확인` : '해당 없음',
    statusType: hasRestriction ? 'negative' : 'positive',
    description: '국토교통부 공표 하도급법 위반 제재 명단을 확인해요.',
    details: hasRestriction
      ? [
          { key: '상호명', value: items[0].companyName || '-' },
          { key: '대표자', value: items[0].representative || '-' },
          { key: '위반법령', value: items[0].violationType || '-' },
          { key: '제한기간', value: `${items[0].restrictionStart} ~ ${items[0].restrictionEnd}` },
          { key: '사업자번호', value: items[0].bizRegNo || '-' },
        ]
      : [],
  }
}

// ─── 사업자 통합 조회 ───────────────────────────────

/**
 * 사업자등록번호로 전체 조회 (서버 전용)
 *
 * Phase 1: NTS + KCOMWEL + KISCON하도급 병렬 (사업자번호만 필요)
 * Phase 2: FEIA + MOEL + KISCON상습체불 병렬 (회사명 필요 → Phase 1에서 획득)
 * 나머지: mock 유지 (CONSTRUCTION_LICENSE, SPECIALTY_LICENSE, ELECTRICAL_LICENSE, RETIREMENT_FUND)
 */
async function _fetchBusinessVerification(
  registrationNumber: string
): Promise<VerifyBusinessResult> {
  // ── Phase 1: 사업자번호로 직접 조회 가능한 API ──
  const [ntsResult, kcomwelResult, subconResult] = await Promise.allSettled([
    fetchNtsBusinessStatus([registrationNumber]),
    fetchKcomwelInsurance(registrationNumber),
    fetchKisconSubconLimit(registrationNumber),
  ])

  // NTS → BUSINESS_STATUS
  let businessStatusItem: CheckItem
  if (ntsResult.status === 'fulfilled' && ntsResult.value.data?.[0]) {
    businessStatusItem = mapNtsStatusToCheckItem(ntsResult.value.data[0])
  } else {
    console.error('NTS API failed:', ntsResult.status === 'rejected' ? ntsResult.reason : 'empty')
    businessStatusItem = {
      ...makeErrorItem('BUSINESS_STATUS', 'BUSINESS_LICENSE', '사업자 상태', '국세청'),
      details: [{ key: '사업자등록번호', value: formatRegNo(registrationNumber) }],
    }
  }

  // KCOMWEL → EMPLOYMENT_INSURANCE + 회사명 추출
  let insuranceItem: CheckItem
  let companyName: string | undefined
  if (kcomwelResult.status === 'fulfilled') {
    insuranceItem = mapKcomwelToCheckItem(kcomwelResult.value)
    if (kcomwelResult.value.length > 0 && kcomwelResult.value[0].saeopjangNm) {
      companyName = kcomwelResult.value[0].saeopjangNm
    }
  } else {
    console.error('Kcomwel API failed:', kcomwelResult.reason)
    insuranceItem = makeErrorItem(
      'EMPLOYMENT_INSURANCE',
      'INSURANCE',
      '고용/산재보험 현황',
      '근로복지공단'
    )
  }

  // KISCON 하도급 → SUBCONTRACT_RESTRICTION
  let subconItem: CheckItem
  if (subconResult.status === 'fulfilled') {
    subconItem = mapKisconSubconToCheckItem(subconResult.value)
  } else {
    console.error('KISCON subcon crawl failed:', subconResult.reason)
    subconItem = makeErrorItem(
      'SUBCONTRACT_RESTRICTION',
      'WAGE_RESTRICTION',
      '하도급 참여제한',
      '국토교통부'
    )
  }

  // ── Phase 2: 회사명 기반 조회 (회사명 없으면 skip → mock 유지) ──
  const realItems = new Map<CheckItemId, CheckItem>([
    ['BUSINESS_STATUS', businessStatusItem],
    ['EMPLOYMENT_INSURANCE', insuranceItem],
    ['SUBCONTRACT_RESTRICTION', subconItem],
  ])

  if (companyName) {
    const [feiaResult, moelResult, arrearsResult] = await Promise.allSettled([
      fetchFeiaCompanies(companyName),
      fetchMoelDefaulters(companyName),
      fetchKisconArrears(companyName),
    ])

    // FEIA → FIRE_LICENSE
    if (feiaResult.status === 'fulfilled') {
      realItems.set('FIRE_LICENSE', mapFeiaToCheckItem(feiaResult.value))
    } else {
      console.error('FEIA crawl failed:', feiaResult.reason)
      realItems.set(
        'FIRE_LICENSE',
        makeErrorItem('FIRE_LICENSE', 'BUSINESS_LICENSE', '소방시설업 면허', '한국소방시설협회')
      )
    }

    // MOEL → WAGE_ARREARS
    if (moelResult.status === 'fulfilled') {
      realItems.set('WAGE_ARREARS', mapMoelToCheckItem(moelResult.value))
    } else {
      console.error('MOEL crawl failed:', moelResult.reason)
      realItems.set(
        'WAGE_ARREARS',
        makeErrorItem('WAGE_ARREARS', 'WAGE_RESTRICTION', '임금체불 이력', '고용노동부')
      )
    }

    // KISCON 상습체불 → HABITUAL_ARREARS
    if (arrearsResult.status === 'fulfilled') {
      realItems.set('HABITUAL_ARREARS', mapKisconArrearsToCheckItem(arrearsResult.value))
    } else {
      console.error('KISCON arrears crawl failed:', arrearsResult.reason)
      realItems.set(
        'HABITUAL_ARREARS',
        makeErrorItem('HABITUAL_ARREARS', 'WAGE_RESTRICTION', '상습체불 이력', '국토교통부')
      )
    }
  }

  // ── mock 순서 기준으로 조합 (연결된 항목은 실데이터, 나머지는 mock) ──
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
