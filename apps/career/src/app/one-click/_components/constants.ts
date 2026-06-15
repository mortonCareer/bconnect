import type { CategoryGroup } from '@/lib/business/types'

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
