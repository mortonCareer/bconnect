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

// FE 공용 지역 단일 정의 — 코드 → { label: 한글 라벨, sido: 카카오 우편번호(shorthand) 실측 리터럴 } (#1000).
// 전남광주통합특별시(2026-07-01 출범, 광주·전남 폐지) 반영. Region·라벨·sido 맵 전부 여기서 파생 — 지역 추가/변경은 이 테이블 한 줄.
// sido는 축약형 11종 + 축약 예외 전체형 5종. 목록 밖 sido는 미상 — 새 행정구역 표기는 조용한 오분류 대신 명시적으로 드러난다.
// #998 BE 공용 Region enum 승격 시 generated 로 교체.
const REGION_DEF = {
  SEOUL: { label: '서울', sido: '서울' },
  BUSAN: { label: '부산', sido: '부산' },
  DAEGU: { label: '대구', sido: '대구' },
  INCHEON: { label: '인천', sido: '인천' },
  JEONNAM_GWANGJU: { label: '전남광주', sido: '전남광주통합특별시' },
  DAEJEON: { label: '대전', sido: '대전' },
  ULSAN: { label: '울산', sido: '울산' },
  SEJONG: { label: '세종', sido: '세종특별자치시' },
  GYEONGGI: { label: '경기', sido: '경기' },
  GANGWON: { label: '강원', sido: '강원특별자치도' },
  CHUNGBUK: { label: '충북', sido: '충북' },
  CHUNGNAM: { label: '충남', sido: '충남' },
  JEONBUK: { label: '전북', sido: '전북특별자치도' },
  GYEONGBUK: { label: '경북', sido: '경북' },
  GYEONGNAM: { label: '경남', sido: '경남' },
  JEJU: { label: '제주', sido: '제주특별자치도' },
} as const

export type Region = keyof typeof REGION_DEF

export const Region = Object.fromEntries(Object.keys(REGION_DEF).map((code) => [code, code])) as {
  [K in Region]: K
}

// 지역(시/도) 한글 라벨 SSOT — career(lib/region.ts)·plan(FilterBar·크롤링 카드)이 공유. 자체 하드코딩 금지.
export const REGION_LABELS = Object.fromEntries(
  Object.entries(REGION_DEF).map(([code, def]) => [code, def.label])
) as Record<Region, string>

export const REGION_LIST = Object.entries(REGION_LABELS).map(([value, label]) => ({
  value: value as Region,
  label,
}))

export function getRegionLabel(region: Region): string {
  return REGION_LABELS[region] ?? region
}

/** 카카오 우편번호(shorthand 표기)가 내려주는 sido 리터럴 유니온 — 시드·픽스처는 string 대신 이걸 사용 */
export type KakaoSido = (typeof REGION_DEF)[Region]['sido']

const SIDO_TO_REGION = Object.fromEntries(
  Object.entries(REGION_DEF).map(([code, def]) => [def.sido, code])
) as Record<KakaoSido, Region>

const reportedUnknownStates = new Set<string>()

/** Address.state(카카오 sido 표기) → Region 정확 일치. 미상이면 undefined + 1회 리포트 (읽기 경로는 크래시 금지). */
export function regionOfState(state: string | null | undefined): Region | undefined {
  if (!state) return undefined
  const trimmed = state.trim()
  if (!trimmed) return undefined
  const region = (SIDO_TO_REGION as Record<string, Region | undefined>)[trimmed]
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
