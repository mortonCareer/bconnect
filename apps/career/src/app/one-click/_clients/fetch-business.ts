import 'server-only'

import * as Sentry from '@sentry/nextjs'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import type {
  CheckItem,
  CheckItemId,
  CompanyInfo,
  KcomwelInsuranceItem,
  NtsStatusItem,
  VerifyOwnerResult,
} from './types'
import { fetchNtsBusinessStatus, fetchNtsBusinessValidate } from './nts-client'
import { fetchKcomwelInsurance } from './kcomwel-client'
import { fetchFeiaCompanies } from './feia-client'
import { fetchMoelDefaulters } from './moel-client'
import { fetchKisconArrearsFromS3, fetchKisconSubconFromS3 } from './kiscon-s3-client'
import type { KisconArrearsItem, KisconSubconLimitItem } from './kiscon-parser'
import {
  fetchConstructionLicense,
  fetchConstructionAdminPenalty,
} from './kiscon-construction-client'
import { fetchRetirementFundProjects } from './cwma-retirement-client'
import type { CwmaRetirementItem } from './cwma-retirement-client'
import type { KisconRegistrationItem, KisconAdminPenaltyItem } from './types'

// ─── 캐시 설정 ───────────────────────────────────

const CACHE_TTL = 3600

// 영속 캐시 (unstable_cache) — 요청 간 공유
const cachedNts = unstable_cache(
  (regNo: string) => fetchNtsBusinessStatus([regNo]),
  ['one-click-nts'],
  { revalidate: CACHE_TTL }
)

const cachedKcomwel = unstable_cache(fetchKcomwelInsurance, ['one-click-kcomwel'], {
  revalidate: CACHE_TTL,
})

const cachedFeia = unstable_cache(fetchFeiaCompanies, ['one-click-feia'], {
  revalidate: CACHE_TTL,
})

const cachedMoel = unstable_cache(fetchMoelDefaulters, ['one-click-moel'], {
  revalidate: CACHE_TTL,
})

const cachedKisconArrears = unstable_cache(fetchKisconArrearsFromS3, ['one-click-kiscon-arrears'], {
  revalidate: CACHE_TTL,
})

const cachedKisconSubcon = unstable_cache(fetchKisconSubconFromS3, ['one-click-kiscon-subcon'], {
  revalidate: CACHE_TTL,
})

const cachedConstructionLicense = unstable_cache(
  fetchConstructionLicense,
  ['one-click-construction-license'],
  { revalidate: CACHE_TTL }
)

const cachedConstructionPenalty = unstable_cache(
  fetchConstructionAdminPenalty,
  ['one-click-construction-penalty'],
  { revalidate: CACHE_TTL }
)

const cachedRetirementFund = unstable_cache(
  fetchRetirementFundProjects,
  ['one-click-retirement-fund'],
  { revalidate: CACHE_TTL }
)

// 요청 내 dedup (React cache) — 여러 항목이 동시 호출해도 실제 API는 1번만 실행
const getNtsData = cache(cachedNts)
const getKcomwelData = cache(cachedKcomwel)

// ─── 헬퍼 ────────────────────────────────────────

/** 종합건설업 업종 (건설산업기본법 시행령 별표 1) */
const GENERAL_CONSTRUCTION_TRADES = [
  '토목공사업',
  '건축공사업',
  '토목건축공사업',
  '조경공사업',
  '산업ㆍ환경설비공사업',
] as const

function isGeneralConstructionTrade(tradeName: string | null): boolean {
  if (!tradeName) return false
  return (GENERAL_CONSTRUCTION_TRADES as readonly string[]).includes(tradeName)
}

function formatRegNo(bNo: string): string {
  if (bNo.length !== 10) return bNo
  return `${bNo.slice(0, 3)}-${bNo.slice(3, 5)}-${bNo.slice(5)}`
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr || dateStr.length !== 8) return dateStr || '-'
  return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6)}`
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

function makeNoNameItem(
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
    status: '미확인',
    statusType: 'neutral',
    description: '사업장명을 확인할 수 없어 조회하지 못했어요.',
    details: [],
  }
}

/**
 * 주소 기반 필터링 — 시/구 단위로 매칭하여 동명이인 회사 제거
 * 매칭 실패 시 원본 반환 (과도한 필터링 방지)
 */
function filterByAddress<T>(items: T[], referenceAddr: string, addrKey: keyof T): T[] {
  // 시/도 + 시/군/구 추출 (예: "서울특별시 강남구 ..." → ["서울특별시", "강남구"])
  const tokens = referenceAddr.split(/\s+/).slice(0, 2)
  if (tokens.length === 0) return items

  const filtered = items.filter((item) => {
    const addr = String(item[addrKey] || '')
    return tokens.some((token) => addr.includes(token))
  })

  // 매칭 결과가 0이면 주소 포맷 차이일 수 있으므로 원본 유지
  return filtered.length > 0 ? filtered : items
}

// ─── NTS Status → CheckItem ─────────────────────

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

// ─── Kcomwel → CheckItem ────────────────────────

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

// ─── FEIA → CheckItem ───────────────────────────

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

// ─── MOEL → CheckItem ──────────────────────────

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
          { key: '체불액', value: items[0].arrearsAmount ? `${items[0].arrearsAmount}원` : '-' },
          { key: '업종', value: items[0].industry || '-' },
          { key: '소재지', value: items[0].companyAddress || '-' },
        ]
      : [],
  }
}

// ─── KISCON 상습체불 → CheckItem ────────────────

function mapKisconArrearsToCheckItem(items: KisconArrearsItem[]): CheckItem {
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

// ─── KISCON 하도급 → CheckItem ──────────────────

function mapKisconSubconToCheckItem(items: KisconSubconLimitItem[]): CheckItem {
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

// ─── KISCON 건설업 면허 → CheckItem ─────────────

function mapConstructionLicenseCheckItem(
  id: 'CONSTRUCTION_LICENSE' | 'SPECIALTY_LICENSE',
  label: string,
  regItems: KisconRegistrationItem[],
  penaltyItems: KisconAdminPenaltyItem[]
): CheckItem {
  const hasLicense = regItems.length > 0
  const hasPenalty = penaltyItems.length > 0
  const first = regItems[0]

  let status: string
  let statusType: CheckItem['statusType']

  if (!hasLicense) {
    status = '미확인'
    statusType = 'neutral'
  } else if (hasPenalty) {
    status = `등록 ${regItems.length}건 / 행정처분 ${penaltyItems.length}건`
    statusType = 'negative'
  } else {
    status = `${regItems.length}건 확인`
    statusType = 'positive'
  }

  const details: CheckItem['details'] = []

  if (hasLicense) {
    details.push(
      { key: '업체명', value: first.company_name || '-' },
      { key: '대표자', value: first.representative || '-' },
      { key: '등록업종', value: first.trade_name || '-' },
      {
        key: '등록일',
        value: first.reg_date ? formatDate(String(first.reg_date)) : '-',
      },
      { key: '소재지', value: first.address || '-' }
    )

    // 2건 이상이면 추가 업종 표시
    if (regItems.length > 1) {
      const others = regItems
        .slice(1)
        .map((r) => r.trade_name)
        .filter(Boolean)
      if (others.length > 0) {
        details.push({ key: '추가 업종', value: others.join(', ') })
      }
    }
  }

  if (hasPenalty) {
    const p = penaltyItems[0]
    details.push(
      { key: '행정처분', value: p.penalty_type || '-' },
      {
        key: '과징금',
        value: p.fine_amount ? `${p.fine_amount.toLocaleString()}원` : '-',
      },
      {
        key: '과태료',
        value: p.penalty_amount ? `${p.penalty_amount.toLocaleString()}원` : '-',
      },
      { key: '위반내용', value: p.violation_content || '-' }
    )
  }

  return {
    id,
    category: 'BUSINESS_LICENSE',
    label,
    source: '국토교통부',
    status,
    statusType,
    description: `국토교통부 KISCON 기준 ${label} 등록 및 행정처분 현황이에요.`,
    details,
  }
}

// ─── CWMA 퇴직공제 → CheckItem ──────────────────

function formatIsoDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10) // YYYY-MM-DD
}

function mapRetirementFundToCheckItem(items: CwmaRetirementItem[]): CheckItem {
  const hasProjects = items.length > 0
  const first = items[0]

  return {
    id: 'RETIREMENT_FUND',
    category: 'INSURANCE',
    label: '퇴직공제 가입 공사 이력',
    source: '건설근로자공제회',
    status: hasProjects ? `${items.length}건 확인` : '미확인',
    statusType: hasProjects ? 'positive' : 'neutral',
    description: '건설근로자공제회 퇴직공제 의무가입 공사 참여 이력이에요.',
    details: hasProjects
      ? [
          { key: '업체명', value: first.company_name || '-' },
          { key: '최근 공사', value: first.project_name || '-' },
          {
            key: '공사금액',
            value: first.total_amount ? `${first.total_amount}억원` : '-',
          },
          {
            key: '공사기간',
            value: `${formatIsoDate(first.start_date)} ~ ${formatIsoDate(first.end_date)}`,
          },
          { key: '발주처', value: first.client_org || '-' },
        ]
      : [],
  }
}

// ─── 미연결 항목 (정적) ──────────────────────────

const PENDING_ITEMS: Record<string, CheckItem> = {
  ELECTRICAL_LICENSE: {
    id: 'ELECTRICAL_LICENSE',
    category: 'BUSINESS_LICENSE',
    label: '전기공사업 면허',
    source: '한국전기공사협회',
    status: '준비 중',
    statusType: 'neutral',
    description: '한국전기공사협회 전기공사업 면허 연결 준비 중이에요.',
    details: [],
  },
}

// ─── 개별 항목 fetcher ──────────────────────────

async function fetchBusinessStatusItem(regNo: string): Promise<CheckItem> {
  try {
    const result = await getNtsData(regNo)
    if (result.data?.[0]) return mapNtsStatusToCheckItem(result.data[0])
    return {
      ...makeErrorItem('BUSINESS_STATUS', 'BUSINESS_LICENSE', '사업자 상태', '국세청'),
      details: [{ key: '사업자등록번호', value: formatRegNo(regNo) }],
    }
  } catch (e) {
    Sentry.captureException(e, { tags: { source: 'nts' }, extra: { regNo } })
    console.error('NTS API failed:', e)
    return {
      ...makeErrorItem('BUSINESS_STATUS', 'BUSINESS_LICENSE', '사업자 상태', '국세청'),
      details: [{ key: '사업자등록번호', value: formatRegNo(regNo) }],
    }
  }
}

async function fetchEmploymentInsuranceItem(regNo: string): Promise<CheckItem> {
  try {
    const items = await getKcomwelData(regNo)
    return mapKcomwelToCheckItem(items)
  } catch (e) {
    Sentry.captureException(e, { tags: { source: 'kcomwel' }, extra: { regNo } })
    console.error('Kcomwel API failed:', e)
    return makeErrorItem('EMPLOYMENT_INSURANCE', 'INSURANCE', '고용/산재보험 현황', '근로복지공단')
  }
}

async function fetchSubcontractRestrictionItem(regNo: string): Promise<CheckItem> {
  try {
    const items = await cachedKisconSubcon(regNo)
    return mapKisconSubconToCheckItem(items)
  } catch (e) {
    Sentry.captureException(e, { tags: { source: 'kiscon' }, extra: { regNo } })
    console.error('KISCON subcon crawl failed:', e)
    return makeErrorItem(
      'SUBCONTRACT_RESTRICTION',
      'WAGE_RESTRICTION',
      '하도급 참여제한',
      '국토교통부'
    )
  }
}

async function fetchFireLicenseItem(regNo: string): Promise<CheckItem> {
  let companyName: string | undefined
  try {
    const kcomwel = await getKcomwelData(regNo)
    companyName = kcomwel[0]?.saeopjangNm
  } catch {
    // KCOMWEL 실패 → 회사명 확인 불가
  }

  if (!companyName) {
    return makeNoNameItem('FIRE_LICENSE', 'BUSINESS_LICENSE', '소방시설업 면허', '한국소방시설협회')
  }

  try {
    const items = await cachedFeia(companyName)
    return mapFeiaToCheckItem(items)
  } catch (e) {
    Sentry.captureException(e, { tags: { source: 'feia' }, extra: { regNo } })
    console.error('FEIA crawl failed:', e)
    return makeErrorItem('FIRE_LICENSE', 'BUSINESS_LICENSE', '소방시설업 면허', '한국소방시설협회')
  }
}

async function fetchWageArrearsItem(regNo: string): Promise<CheckItem> {
  let companyName: string | undefined
  let companyAddr: string | undefined
  try {
    const kcomwel = await getKcomwelData(regNo)
    companyName = kcomwel[0]?.saeopjangNm
    companyAddr = kcomwel[0]?.addr
  } catch {
    // KCOMWEL 실패 → 회사명 확인 불가
  }

  if (!companyName) {
    return makeNoNameItem('WAGE_ARREARS', 'WAGE_RESTRICTION', '임금체불 이력', '고용노동부')
  }

  try {
    let items = await cachedMoel(companyName)
    // 동명이인 회사 필터링: KCOMWEL 주소와 시/구 단위 매칭
    if (companyAddr && items.length > 1) {
      items = filterByAddress(items, companyAddr, 'companyAddress')
    }
    return mapMoelToCheckItem(items)
  } catch (e) {
    Sentry.captureException(e, { tags: { source: 'moel' }, extra: { regNo } })
    console.error('MOEL crawl failed:', e)
    return makeErrorItem('WAGE_ARREARS', 'WAGE_RESTRICTION', '임금체불 이력', '고용노동부')
  }
}

async function fetchHabitualArrearsItem(regNo: string): Promise<CheckItem> {
  let companyName: string | undefined
  try {
    const kcomwel = await getKcomwelData(regNo)
    companyName = kcomwel[0]?.saeopjangNm
  } catch {
    // KCOMWEL 실패 → 회사명 확인 불가
  }

  if (!companyName) {
    return makeNoNameItem('HABITUAL_ARREARS', 'WAGE_RESTRICTION', '상습체불 이력', '국토교통부')
  }

  try {
    const items = await cachedKisconArrears(companyName)
    return mapKisconArrearsToCheckItem(items)
  } catch (e) {
    Sentry.captureException(e, { tags: { source: 'kiscon' }, extra: { regNo } })
    console.error('KISCON arrears crawl failed:', e)
    return makeErrorItem('HABITUAL_ARREARS', 'WAGE_RESTRICTION', '상습체불 이력', '국토교통부')
  }
}

async function fetchConstructionLicenseItem(regNo: string): Promise<CheckItem> {
  try {
    const [regItems, penaltyItems] = await Promise.all([
      cachedConstructionLicense(regNo),
      cachedConstructionPenalty(regNo),
    ])
    const generalReg = regItems.filter((r) => isGeneralConstructionTrade(r.trade_name))
    const generalPenalty = penaltyItems.filter((r) => isGeneralConstructionTrade(r.trade_name))
    return mapConstructionLicenseCheckItem(
      'CONSTRUCTION_LICENSE',
      '종합건설업 면허',
      generalReg,
      generalPenalty
    )
  } catch (e) {
    Sentry.captureException(e, { tags: { source: 'kiscon-construction' }, extra: { regNo } })
    console.error('KISCON construction query failed:', e)
    return makeErrorItem(
      'CONSTRUCTION_LICENSE',
      'BUSINESS_LICENSE',
      '종합건설업 면허',
      '국토교통부'
    )
  }
}

async function fetchRetirementFundItem(regNo: string): Promise<CheckItem> {
  let companyName: string | undefined
  try {
    const kcomwel = await getKcomwelData(regNo)
    companyName = kcomwel[0]?.saeopjangNm
  } catch {
    // KCOMWEL 실패 → 회사명 확인 불가
  }

  if (!companyName) {
    return makeNoNameItem(
      'RETIREMENT_FUND',
      'INSURANCE',
      '퇴직공제 가입 공사 이력',
      '건설근로자공제회'
    )
  }

  try {
    const items = await cachedRetirementFund(companyName)
    return mapRetirementFundToCheckItem(items)
  } catch (e) {
    Sentry.captureException(e, { tags: { source: 'cwma' }, extra: { regNo } })
    console.error('CWMA retirement fund query failed:', e)
    return makeErrorItem(
      'RETIREMENT_FUND',
      'INSURANCE',
      '퇴직공제 가입 공사 이력',
      '건설근로자공제회'
    )
  }
}

async function fetchSpecialtyLicenseItem(regNo: string): Promise<CheckItem> {
  try {
    const [regItems, penaltyItems] = await Promise.all([
      cachedConstructionLicense(regNo),
      cachedConstructionPenalty(regNo),
    ])
    const specialtyReg = regItems.filter((r) => !isGeneralConstructionTrade(r.trade_name))
    const specialtyPenalty = penaltyItems.filter((r) => !isGeneralConstructionTrade(r.trade_name))
    return mapConstructionLicenseCheckItem(
      'SPECIALTY_LICENSE',
      '전문건설업 면허',
      specialtyReg,
      specialtyPenalty
    )
  } catch (e) {
    Sentry.captureException(e, { tags: { source: 'kiscon-construction' }, extra: { regNo } })
    console.error('KISCON specialty query failed:', e)
    return makeErrorItem('SPECIALTY_LICENSE', 'BUSINESS_LICENSE', '전문건설업 면허', '국토교통부')
  }
}

// ─── 공개 API ────────────────────────────────────

/**
 * 개별 CheckItem 조회 (per-item Suspense 스트리밍용)
 * - React cache()로 같은 요청 내 dedup (SummarySection + DetailSection 동시 호출 시)
 * - 내부 API 호출은 unstable_cache로 영속 캐시
 */
export const fetchCheckItemById = cache(
  async (id: CheckItemId, regNo: string): Promise<CheckItem> => {
    switch (id) {
      case 'BUSINESS_STATUS':
        return fetchBusinessStatusItem(regNo)
      case 'EMPLOYMENT_INSURANCE':
        return fetchEmploymentInsuranceItem(regNo)
      case 'SUBCONTRACT_RESTRICTION':
        return fetchSubcontractRestrictionItem(regNo)
      case 'FIRE_LICENSE':
        return fetchFireLicenseItem(regNo)
      case 'WAGE_ARREARS':
        return fetchWageArrearsItem(regNo)
      case 'HABITUAL_ARREARS':
        return fetchHabitualArrearsItem(regNo)
      case 'CONSTRUCTION_LICENSE':
        return fetchConstructionLicenseItem(regNo)
      case 'SPECIALTY_LICENSE':
        return fetchSpecialtyLicenseItem(regNo)
      case 'RETIREMENT_FUND':
        return fetchRetirementFundItem(regNo)
      default:
        return PENDING_ITEMS[id]
    }
  }
)

/**
 * 회사 정보 조회 (CompanyHeader용)
 * KCOMWEL에서 사업장명 추출
 */
export const getCompanyInfo = cache(async (regNo: string): Promise<CompanyInfo> => {
  try {
    const items = await getKcomwelData(regNo)
    return {
      name: items[0]?.saeopjangNm ?? '-',
      registrationNumber: formatRegNo(regNo),
    }
  } catch {
    return {
      name: '-',
      registrationNumber: formatRegNo(regNo),
    }
  }
})

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
    Sentry.captureException(error, { tags: { source: 'nts' } })
    console.error('NTS validate API failed:', error)
    return { valid: false, message: '진위확인에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
}
