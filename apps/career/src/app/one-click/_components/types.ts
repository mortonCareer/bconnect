/** 검사 항목 카테고리 */
export type CheckCategory = 'BUSINESS_LICENSE' | 'WAGE_RESTRICTION' | 'INSURANCE'

/** 검사 항목 ID */
export type CheckItemId =
  | 'BUSINESS_STATUS'
  | 'CONSTRUCTION_LICENSE'
  | 'SPECIALTY_LICENSE'
  | 'ELECTRICAL_LICENSE'
  | 'FIRE_LICENSE'
  | 'WAGE_ARREARS'
  | 'HABITUAL_ARREARS'
  | 'SUBCONTRACT_RESTRICTION'
  | 'RETIREMENT_FUND'
  | 'EMPLOYMENT_INSURANCE'

/** 상태 유형 (배지 색상 결정) */
export type StatusType = 'positive' | 'neutral' | 'negative' | 'error'

/** 상세 정보 key-value */
export interface CheckDetail {
  key: string
  value: string
}

/** 개별 검사 항목 */
export interface CheckItem {
  id: CheckItemId
  category: CheckCategory
  label: string
  source: string
  status: string
  statusType: StatusType
  details: CheckDetail[]
  description?: string
  externalUrl?: string
}

/** 회사 정보 */
export interface CompanyInfo {
  name: string
  registrationNumber: string
}

/** 조회 응답 전체 */
export interface VerifyBusinessResult {
  company: CompanyInfo
  checkItems: CheckItem[]
}

/** 카테고리 그룹 정의 (UI 렌더링용) */
export interface CategoryGroup {
  id: CheckCategory
  label: string
  itemIds: CheckItemId[]
}

/** 진위확인 응답 */
export interface VerifyOwnerResult {
  valid: boolean
  message: string
}
