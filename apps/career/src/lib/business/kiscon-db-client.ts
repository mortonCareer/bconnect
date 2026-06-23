import 'server-only'

import { getDb } from '@/lib/db'
import type { KisconArrearsItem, KisconSubconLimitItem } from './kiscon-parser'

export type { KisconArrearsItem, KisconSubconLimitItem }

// 14일 이내 동기화된 데이터만 유효
const FRESHNESS_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000

/**
 * KISCON DB 데이터 freshness 체크
 * synced_at이 14일 이내인지 확인
 */
export async function checkKisconFreshness(): Promise<void> {
  const sql = getDb()
  const stale: string[] = []

  const [arrears] = await sql<{ synced_at: Date }[]>`
    SELECT synced_at FROM kiscon_arrears ORDER BY synced_at DESC LIMIT 1
  `
  if (!arrears || Date.now() - arrears.synced_at.getTime() > FRESHNESS_THRESHOLD_MS) {
    stale.push(`KISCON 상습체불 (last: ${arrears?.synced_at.toISOString() ?? 'none'})`)
  }

  const [subcon] = await sql<{ synced_at: Date }[]>`
    SELECT synced_at FROM kiscon_subcon_limits ORDER BY synced_at DESC LIMIT 1
  `
  if (!subcon || Date.now() - subcon.synced_at.getTime() > FRESHNESS_THRESHOLD_MS) {
    stale.push(`KISCON 하도급제한 (last: ${subcon?.synced_at.toISOString() ?? 'none'})`)
  }

  if (stale.length > 0) {
    throw new Error(`KISCON DB 데이터 만료: ${stale.join(', ')}`)
  }
}

// ─── 조회 함수 ──────────────────────────────────

/**
 * DB에서 상습체불 데이터 조회 + 회사명 매칭
 * 동기화 시점에 이미 만료 데이터가 제거되므로 추가 필터 불필요
 */
export async function fetchKisconArrears(companyName: string): Promise<KisconArrearsItem[]> {
  const sql = getDb()
  const normalized = companyName.replace(/\s/g, '')

  // DB에서 전체 조회 후 회사명 매칭 (소규모 데이터)
  const rows = await sql<
    {
      company_name: string
      address: string
      representative: string
      penalty_history: string
      arrears_amount: string
      publication_period: string
    }[]
  >`
    SELECT company_name, address, representative,
           penalty_history, arrears_amount, publication_period
    FROM kiscon_arrears
  `

  return rows
    .filter((row) => {
      const itemName = row.company_name.replace(/\s/g, '')
      return itemName.includes(normalized) || normalized.includes(itemName)
    })
    .map((row) => ({
      companyName: row.company_name,
      address: row.address,
      representative: row.representative,
      penaltyHistory: row.penalty_history,
      arrearsAmount: row.arrears_amount,
      publicationPeriod: row.publication_period,
    }))
}

/**
 * DB에서 하도급참여제한 데이터 조회 + 사업자번호 매칭
 * 동기화 시점에 이미 만료 데이터가 제거되므로 추가 필터 불필요
 */
export async function fetchKisconSubconLimits(
  registrationNumber: string
): Promise<KisconSubconLimitItem[]> {
  const sql = getDb()

  const rows = await sql<
    {
      violation_type: string
      company_name: string
      corp_no: string
      biz_reg_no: string
      representative: string
      restriction_start: string
      restriction_end: string
      category: string
      announcement_date: string
    }[]
  >`
    SELECT violation_type, company_name, corp_no, biz_reg_no,
           representative, restriction_start, restriction_end,
           category, announcement_date
    FROM kiscon_subcon_limits
    WHERE biz_reg_no = ${registrationNumber}
  `

  return rows.map((row) => ({
    violationType: row.violation_type,
    companyName: row.company_name,
    corpNo: row.corp_no,
    bizRegNo: row.biz_reg_no,
    representative: row.representative,
    restrictionStart: row.restriction_start,
    restrictionEnd: row.restriction_end,
    category: row.category,
    announcementDate: row.announcement_date,
  }))
}
