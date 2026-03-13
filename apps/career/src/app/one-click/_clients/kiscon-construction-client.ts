import 'server-only'

import { getDb } from '../../../../lib/db'
import type { KisconRegistrationItem, KisconAdminPenaltyItem } from './types'

/**
 * 건설업 면허 등록 조회
 * @param bizRegNo 사업자등록번호 (10자리, 하이픈 없음)
 */
export async function fetchConstructionLicense(
  bizRegNo: string
): Promise<KisconRegistrationItem[]> {
  const sql = getDb()
  const rows = await sql<KisconRegistrationItem[]>`
    SELECT * FROM kiscon_registration
    WHERE biz_reg_no = ${bizRegNo}
    ORDER BY reg_date DESC
  `
  return rows
}

/**
 * 행정처분 이력 조회
 * @param bizRegNo 사업자등록번호 (10자리, 하이픈 없음)
 */
export async function fetchConstructionAdminPenalty(
  bizRegNo: string
): Promise<KisconAdminPenaltyItem[]> {
  const sql = getDb()
  const rows = await sql<KisconAdminPenaltyItem[]>`
    SELECT * FROM kiscon_admin_penalty
    WHERE biz_reg_no = ${bizRegNo}
    ORDER BY penalty_date DESC
  `
  return rows
}
