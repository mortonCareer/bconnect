// KISCON 상습체불·하도급참여제한 크롤링 → kiscon_arrears / kiscon_subcon_limits (전체 교체)

import { createDb, insertBatched, notifySlack, runSync } from './lib'
import {
  isArrearsActive,
  isSubconActive,
  parseArrearsHtml,
  parseSubconLimitHtml,
  parseTotalCount,
} from './kiscon-parser'

const KISCON_ARREARS_URL = 'https://kiscon.net/cis/coad_arrearsnotice.asp'
const KISCON_SUBCON_URL = 'https://kiscon.net/cis/coad_subcon_limit_list.asp'

const sql = createDb()

async function ensureTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS kiscon_arrears (
      id                 SERIAL PRIMARY KEY,
      company_name       TEXT NOT NULL,
      address            TEXT,
      representative     TEXT,
      penalty_history    TEXT,
      arrears_amount     TEXT,
      publication_period TEXT,
      synced_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS kiscon_subcon_limits (
      id                 SERIAL PRIMARY KEY,
      violation_type     TEXT,
      company_name       TEXT NOT NULL,
      corp_no            TEXT,
      biz_reg_no         TEXT NOT NULL,
      representative     TEXT,
      restriction_start  TEXT,
      restriction_end    TEXT,
      category           TEXT,
      announcement_date  TEXT,
      synced_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_kiscon_subcon_biz_no
    ON kiscon_subcon_limits (biz_reg_no)
  `
}

async function fetchHtml(url: string, body: Record<string, string>): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`)
  }

  return response.text()
}

async function fetchAllPages<T>(
  url: string,
  baseBody: Record<string, string>,
  parseHtml: (html: string) => T[]
): Promise<T[]> {
  const firstHtml = await fetchHtml(url, { ...baseBody, GotoPage: '1' })
  const firstItems = parseHtml(firstHtml)
  const totalCount = parseTotalCount(firstHtml)

  if (totalCount === 0 || firstItems.length === 0) return firstItems

  const pageSize = firstItems.length
  const totalPages = Math.ceil(totalCount / pageSize)

  if (totalPages <= 1) return firstItems

  console.log(`[kiscon-sync]   총 ${totalCount}건, ${totalPages}페이지 (${pageSize}건/페이지)`)

  const allItems = [...firstItems]
  for (let page = 2; page <= totalPages; page++) {
    const html = await fetchHtml(url, { ...baseBody, GotoPage: String(page) })
    const items = parseHtml(html)
    allItems.push(...items)
    if (items.length < pageSize) break // 마지막 페이지
  }

  return allItems
}

async function main() {
  await ensureTables()

  console.log('[kiscon-sync] 상습체불 크롤링...')
  const arrearsAll = await fetchAllPages(KISCON_ARREARS_URL, {}, parseArrearsHtml)
  const arrearsItems = arrearsAll.filter(isArrearsActive)
  console.log(
    `[kiscon-sync] 상습체불: ${arrearsAll.length}건 중 유효 ${arrearsItems.length}건 (만료 ${arrearsAll.length - arrearsItems.length}건 제외)`
  )

  console.log('[kiscon-sync] 하도급참여제한 크롤링...')
  const subconAll = await fetchAllPages(KISCON_SUBCON_URL, {}, parseSubconLimitHtml)
  const subconItems = subconAll.filter(isSubconActive)
  console.log(
    `[kiscon-sync] 하도급참여제한: ${subconAll.length}건 중 유효 ${subconItems.length}건 (만료 ${subconAll.length - subconItems.length}건 제외)`
  )

  await sql.begin(async (tx) => {
    await tx`DELETE FROM kiscon_arrears`
    await insertBatched(
      tx,
      'kiscon_arrears',
      arrearsItems.map((item) => ({
        company_name: item.companyName,
        address: item.address,
        representative: item.representative,
        penalty_history: item.penaltyHistory,
        arrears_amount: item.arrearsAmount,
        publication_period: item.publicationPeriod,
      }))
    )
    console.log(`[kiscon-sync] kiscon_arrears: ${arrearsItems.length}건 저장`)

    await tx`DELETE FROM kiscon_subcon_limits`
    await insertBatched(
      tx,
      'kiscon_subcon_limits',
      subconItems.map((item) => ({
        violation_type: item.violationType,
        company_name: item.companyName,
        corp_no: item.corpNo,
        biz_reg_no: item.bizRegNo.replace(/[-\s]/g, ''),
        representative: item.representative,
        restriction_start: item.restrictionStart,
        restriction_end: item.restrictionEnd,
        category: item.category,
        announcement_date: item.announcementDate,
      }))
    )
    console.log(`[kiscon-sync] kiscon_subcon_limits: ${subconItems.length}건 저장`)
  })

  const summary = [
    `✅ *KISCON 동기화 완료*`,
    `상습체불: ${arrearsItems.length}건`,
    `하도급참여제한: ${subconItems.length}건`,
  ].join('\n')

  console.log(`[kiscon-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('kiscon-sync', sql, main)
