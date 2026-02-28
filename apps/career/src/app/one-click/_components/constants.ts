import type { CategoryGroup } from '../_clients/types'

/** 카테고리별 검사 항목 그룹 */
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'BUSINESS_LICENSE',
    label: '사업자 · 면허',
    itemIds: [
      'BUSINESS_STATUS',
      'CONSTRUCTION_LICENSE',
      'SPECIALTY_LICENSE',
      'ELECTRICAL_LICENSE',
      'FIRE_LICENSE',
    ],
  },
  {
    id: 'WAGE_RESTRICTION',
    label: '임금체불 · 참여제한',
    itemIds: ['WAGE_ARREARS', 'HABITUAL_ARREARS', 'SUBCONTRACT_RESTRICTION'],
  },
  {
    id: 'INSURANCE',
    label: '퇴직공제 · 고용/산재보험',
    itemIds: ['RETIREMENT_FUND', 'EMPLOYMENT_INSURANCE'],
  },
]

/** 사업자등록번호 포맷팅 (xxx-xx-xxxxx) */
export function formatRegistrationNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

/** 사업자등록번호에서 숫자만 추출 */
export function extractDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** 사업자등록번호 유효성 검증 (10자리 숫자) */
export function isValidRegistrationNumber(value: string): boolean {
  return /^\d{10}$/.test(extractDigits(value))
}
