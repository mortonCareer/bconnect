import 'server-only'

import { getDb } from './db'
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
    WHERE ncr_master_num = ${bizRegNo}
    ORDER BY ncr_gs_date DESC
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
    WHERE ncr_master_num = ${bizRegNo}
    ORDER BY ncr_gs_date DESC
  `
  return rows
}
