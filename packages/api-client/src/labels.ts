import { CrawledRegion, Trade, type CredentialType } from './generated/schemas'

export const TRADE_LABELS: Record<Trade, string> = {
  [Trade.DESIGN]: '설계',
  [Trade.DEMOLITION]: '철거/확장',
  [Trade.ELECTRICAL]: '전기',
  [Trade.PLUMBING]: '배관',
  [Trade.MECHANICAL]: '설비',
  [Trade.MASONRY]: '조적',
  [Trade.CARPENTRY]: '목공',
  [Trade.GLAZING]: '창호',
  [Trade.WATERPROOFING]: '방수',
  [Trade.PLASTERING]: '미장',
  [Trade.INSULATION]: '단열',
  [Trade.TILING]: '타일',
  [Trade.GROUTING]: '줄눈',
  [Trade.PAINTING]: '도장',
  [Trade.WALLPAPER]: '도배',
  [Trade.FILM_SHEET]: '필름/시트',
  [Trade.HARDWOOD]: '마루',
  [Trade.VINYL]: '장판',
  [Trade.SINK]: '싱크대',
  [Trade.FURNITURE]: '가구',
  [Trade.AIR_CONDITIONING]: '에어컨',
  [Trade.HOISTING]: '양중/곰방',
  [Trade.TRANSPORT]: '운송',
  [Trade.CLEANING]: '청소',
  [Trade.GENERAL_LABOR]: '보통인부',
}

export const TRADE_LIST = Object.entries(TRADE_LABELS).map(([value, label]) => ({
  value: value as Trade,
  label,
}))

/** 시공분야 카테고리별 그룹 (Figma 디자인 기준) */
export const TRADE_GROUPS: { label: string; trades: Trade[] }[] = [
  {
    label: '기반공정',
    trades: [Trade.DESIGN, Trade.DEMOLITION, Trade.ELECTRICAL, Trade.PLUMBING, Trade.MECHANICAL],
  },
  {
    label: '구조공정',
    trades: [
      Trade.MASONRY,
      Trade.CARPENTRY,
      Trade.GLAZING,
      Trade.WATERPROOFING,
      Trade.PLASTERING,
      Trade.INSULATION,
    ],
  },
  {
    label: '마감공정',
    trades: [
      Trade.TILING,
      Trade.GROUTING,
      Trade.PAINTING,
      Trade.WALLPAPER,
      Trade.FILM_SHEET,
      Trade.HARDWOOD,
      Trade.VINYL,
    ],
  },
  {
    label: '설치',
    trades: [Trade.SINK, Trade.FURNITURE, Trade.AIR_CONDITIONING],
  },
  {
    label: '현장지원',
    trades: [Trade.HOISTING, Trade.TRANSPORT, Trade.CLEANING, Trade.GENERAL_LABOR],
  },
]

export function getTradeLabel(trade: Trade): string {
  return TRADE_LABELS[trade] ?? trade
}

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  IDENTITY_VERIFICATION: '본인인증',
  SOLE_PROPRIETOR: '개인사업자',
  CONSTRUCTION_LICENSE: '건설면허',
  SPECIALTY_CONSTRUCTION_LICENSE: '전문건설면허',
  CAREER_CERTIFICATE: '경력증명서',
  SKILL_GRADE_CERTIFICATE: '기능등급증명서',
  OTHER_CERTIFICATE: '기타 증명서',
  NATIONAL_TECHNICAL_QUALIFICATION: '국가기술자격증',
  SKILLED_TECHNICIAN: '숙련기술인',
  OTHER_QUALIFICATION: '기타 자격증',
}

export function getCredentialLabel(type: CredentialType): string {
  return CREDENTIAL_TYPE_LABELS[type] ?? type
}

// FE 공용 지역 코드 — 전남광주통합특별시(2026-07-01 출범, 광주·전남 폐지) 반영.
// #998 BE 공용 Region enum 승격 전까지의 FE 독립 정의(generated enum 과 같은 const 객체 스타일). 승격 시 generated 로 교체.
export const Region = {
  SEOUL: 'SEOUL',
  BUSAN: 'BUSAN',
  DAEGU: 'DAEGU',
  INCHEON: 'INCHEON',
  JEONNAM_GWANGJU: 'JEONNAM_GWANGJU',
  DAEJEON: 'DAEJEON',
  ULSAN: 'ULSAN',
  SEJONG: 'SEJONG',
  GYEONGGI: 'GYEONGGI',
  GANGWON: 'GANGWON',
  CHUNGBUK: 'CHUNGBUK',
  CHUNGNAM: 'CHUNGNAM',
  JEONBUK: 'JEONBUK',
  GYEONGBUK: 'GYEONGBUK',
  GYEONGNAM: 'GYEONGNAM',
  JEJU: 'JEJU',
} as const

export type Region = (typeof Region)[keyof typeof Region]

// 지역(시/도) 한글 라벨 SSOT — career(lib/region.ts)·plan(FilterBar·크롤링 카드)이 공유. 자체 하드코딩 금지.
export const REGION_LABELS: Record<Region, string> = {
  SEOUL: '서울',
  BUSAN: '부산',
  DAEGU: '대구',
  INCHEON: '인천',
  JEONNAM_GWANGJU: '전남광주',
  DAEJEON: '대전',
  ULSAN: '울산',
  SEJONG: '세종',
  GYEONGGI: '경기',
  GANGWON: '강원',
  CHUNGBUK: '충북',
  CHUNGNAM: '충남',
  JEONBUK: '전북',
  GYEONGBUK: '경북',
  GYEONGNAM: '경남',
  JEJU: '제주',
}

export const REGION_LIST = Object.entries(REGION_LABELS).map(([value, label]) => ({
  value: value as Region,
  label,
}))

export function getRegionLabel(region: Region): string {
  return REGION_LABELS[region] ?? region
}

// 카카오 우편번호(shorthand 표기)가 내려주는 sido 리터럴 → Region 정확 일치 맵 (#1000 위젯 실측).
// 축약형 11종 + 축약 예외 전체형 5종. '광주'·'전남'은 통합 전 저장 행 호환 별칭.
// 목록에 없는 값은 미상 — 새 행정구역 표기가 나오면 조용한 오분류 대신 명시적으로 드러난다.
const SIDO_TO_REGION: Record<string, Region> = {
  서울: 'SEOUL',
  부산: 'BUSAN',
  대구: 'DAEGU',
  인천: 'INCHEON',
  대전: 'DAEJEON',
  울산: 'ULSAN',
  경기: 'GYEONGGI',
  충북: 'CHUNGBUK',
  충남: 'CHUNGNAM',
  경북: 'GYEONGBUK',
  경남: 'GYEONGNAM',
  세종특별자치시: 'SEJONG',
  강원특별자치도: 'GANGWON',
  전북특별자치도: 'JEONBUK',
  제주특별자치도: 'JEJU',
  전남광주통합특별시: Region.JEONNAM_GWANGJU,
  광주: Region.JEONNAM_GWANGJU,
  전남: Region.JEONNAM_GWANGJU,
}

const reportedUnknownStates = new Set<string>()

/** Address.state(카카오 sido 표기) → Region 정확 일치. 미상이면 undefined + 1회 리포트 (읽기 경로는 크래시 금지). */
export function regionOfState(state: string | null | undefined): Region | undefined {
  if (!state) return undefined
  const trimmed = state.trim()
  if (!trimmed) return undefined
  const region = SIDO_TO_REGION[trimmed]
  if (region === undefined && !reportedUnknownStates.has(trimmed)) {
    reportedUnknownStates.add(trimmed)
    console.warn(`[regionOfState] 미등록 시/도 표기 "${trimmed}" — 지역 미상 처리 (#1000)`)
  }
  return region
}

/** 크롤링 도메인 CrawledRegion → Region. 폐지된 광주·전남 값은 통합 지역으로 흡수. */
export function regionOfCrawled(state: CrawledRegion): Region {
  return state === 'GWANGJU' || state === 'JEONNAM' ? Region.JEONNAM_GWANGJU : state
}
