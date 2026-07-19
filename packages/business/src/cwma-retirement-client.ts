import 'server-only'

import { getDb } from './db'

export interface CwmaRetirementItem {
  project_name: string
  total_amount: number | null
  start_date: string | null
  end_date: string | null
  company_name: string
  client_org: string | null
  address: string | null
}

/**
 * 업체명에서 법인격 표기를 제거하고 정규화
 * 동기화 스크립트의 normalizeCompanyName과 동일한 로직
 */
function normalizeCompanyName(name: string): string {
  return name
    .replace(/\(주\)/g, '')
    .replace(/\(유\)/g, '')
    .replace(/\(합\)/g, '')
    .replace(/\(사\)/g, '')
    .replace(/주식회사/g, '')
    .replace(/유한회사/g, '')
    .replace(/합자회사/g, '')
    .replace(/합명회사/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * 퇴직공제 가입 공사 이력 조회
 * @param companyName 업체명 (KCOMWEL/KISCON에서 획득)
 */
export async function fetchRetirementFundProjects(
  companyName: string
): Promise<CwmaRetirementItem[]> {
  const sql = getDb()
  const normalized = normalizeCompanyName(companyName)
  return sql<CwmaRetirementItem[]>`
    SELECT project_name, total_amount, start_date, end_date,
           company_name, client_org, address
    FROM cwma_retirement_fund
    WHERE normalized_company_name = ${normalized}
    ORDER BY start_date DESC
  `
}
