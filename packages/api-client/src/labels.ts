import {
  ProfileRole,
  Region,
  TaskProgress,
  TaskStatus,
  Trade,
  type CredentialType,
} from './generated/schemas'

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

// 등급(역할) 한글 라벨 SSOT — career(회원가입·홈 피드 필터)·features(추천서·메시지) 공유. 자체 하드코딩 금지.
export const ROLE_LABELS: Record<ProfileRole, string> = {
  [ProfileRole.CLIENT]: '소비자',
  [ProfileRole.ARCHITECT]: '건축사',
  [ProfileRole.CONTRACTOR]: '건설업자',
  [ProfileRole.FOREMAN]: '반장',
  [ProfileRole.SKILLED]: '기공',
  [ProfileRole.SEMI_SKILLED]: '준기공',
  [ProfileRole.HELPER]: '조공',
}

export function getRoleLabel(role: ProfileRole): string {
  return ROLE_LABELS[role] ?? role
}

// 작업 상태 한글 라벨 SSOT — 섭외 축(TaskStatus)·진행 축(TaskProgress)은 별개 값이다.
// plan(공정표 상태 컬럼)·career(캘린더 상세) 공유. 자체 하드코딩 금지.
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.NONE]: '모집 전',
  [TaskStatus.OPEN]: '모집 중',
  [TaskStatus.OFFERED]: '섭외 중',
  [TaskStatus.ASSIGNED]: '섭외됨',
}

export const TASK_PROGRESS_LABELS: Record<TaskProgress, string> = {
  [TaskProgress.TODO]: '시작 전',
  [TaskProgress.IN_PROGRESS]: '진행 중',
  [TaskProgress.COMPLETED]: '완료됨',
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

// 지역(시/도) 한글 라벨 SSOT — 공용 Region enum(#998, BE canonical 한글값) 기반.
// career(lib/region.ts)·plan(FilterBar·크롤링 카드)이 공유. 자체 하드코딩 금지.
// Region 값 대부분은 표시 라벨과 동일하고, 통합·특별자치 명칭만 짧은 라벨로 축약.
export const REGION_LABELS: Record<Region, string> = {
  [Region.서울]: '서울',
  [Region.부산]: '부산',
  [Region.대구]: '대구',
  [Region.인천]: '인천',
  [Region.대전]: '대전',
  [Region.울산]: '울산',
  [Region.세종특별자치시]: '세종',
  [Region.경기]: '경기',
  [Region.강원특별자치도]: '강원',
  [Region.충북]: '충북',
  [Region.충남]: '충남',
  [Region.전북특별자치도]: '전북',
  [Region.전남광주통합특별시]: '전남광주',
  [Region.경북]: '경북',
  [Region.경남]: '경남',
  [Region.제주특별자치도]: '제주',
}

export const REGION_LIST = Object.entries(REGION_LABELS).map(([value, label]) => ({
  value: value as Region,
  label,
}))

export function getRegionLabel(region: Region): string {
  return REGION_LABELS[region] ?? region
}

const REGION_VALUES = new Set<string>(Object.values(Region))
const reportedUnknownStates = new Set<string>()

/** 카카오 우편번호 sido 문자열 → Region 정확 일치 검증. 미상이면 undefined + 1회 리포트 (읽기 경로는 크래시 금지). */
export function regionOfState(state: string | null | undefined): Region | undefined {
  if (!state) return undefined
  const trimmed = state.trim()
  if (!trimmed) return undefined
  if (REGION_VALUES.has(trimmed)) return trimmed as Region
  if (!reportedUnknownStates.has(trimmed)) {
    reportedUnknownStates.add(trimmed)
    console.warn(`[regionOfState] 미등록 시/도 표기 "${trimmed}" — 지역 미상 처리 (#1000)`)
  }
  return undefined
}
