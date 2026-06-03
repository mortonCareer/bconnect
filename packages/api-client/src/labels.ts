import { Trade, type CredentialType } from './generated/schemas'

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
