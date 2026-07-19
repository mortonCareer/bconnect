/**
 * KISCON 데이터 동기화 스크립트
 *
 * kiscon.net에서 전체 목록을 크롤링 → Railway Postgres에 저장
 * - 상습체불건설사업자명단 → kiscon_arrears
 * - 하도급참여제한대상자 → kiscon_subcon_limits
 *
 * 매 동기화 시 기존 데이터를 전체 교체 (DELETE → INSERT)
 * - 자연 PK가 없고, 만료 데이터가 자동 제거되어야 하므로
 *
 * 실행: pnpm --filter @bconnect/career exec tsx scripts/kiscon-sync.ts
 * 환경변수: DATABASE_URL, SLACK_WEBHOOK_URL (선택)
 */

import postgres from 'postgres'
import {
  isArrearsActive,
  isSubconActive,
  parseArrearsHtml,
  parseSubconLimitHtml,
  parseTotalCount,
} from '@bconnect/business/kiscon-parser'

// ─── 설정 ───────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

const KISCON_ARREARS_URL = 'https://kiscon.net/cis/coad_arrearsnotice.asp'
const KISCON_SUBCON_URL = 'https://kiscon.net/cis/coad_subcon_limit_list.asp'

if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

const sql = postgres(DATABASE_URL, { max: 5 })

// ─── DDL ────────────────────────────────────────

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

// ─── HTML 크롤링 ────────────────────────────────

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

/**
 * 전체 페이지를 순회하여 모든 아이템 수집
 * 1페이지 HTML에서 totalcnt를 읽고, pageSize로 총 페이지 수를 계산
 */
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

// ─── Slack 알림 ─────────────────────────────────

async function notifySlack(message: string): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })
  } catch (e) {
    console.error('[slack] notification failed:', e)
  }
}

// ─── 메인 ───────────────────────────────────────

async function main() {
  console.log(`[kiscon-sync] 시작: ${new Date().toISOString()}`)

  await ensureTables()

  // 상습체불 크롤링 (전체 페이지 순회)
  console.log('[kiscon-sync] 상습체불 크롤링...')
  const arrearsAll = await fetchAllPages(KISCON_ARREARS_URL, {}, parseArrearsHtml)
  const arrearsItems = arrearsAll.filter(isArrearsActive)
  console.log(
    `[kiscon-sync] 상습체불: ${arrearsAll.length}건 중 유효 ${arrearsItems.length}건 (만료 ${arrearsAll.length - arrearsItems.length}건 제외)`
  )

  // 하도급참여제한 크롤링 (전체 페이지 순회)
  console.log('[kiscon-sync] 하도급참여제한 크롤링...')
  const subconAll = await fetchAllPages(KISCON_SUBCON_URL, {}, parseSubconLimitHtml)
  const subconItems = subconAll.filter(isSubconActive)
  console.log(
    `[kiscon-sync] 하도급참여제한: ${subconAll.length}건 중 유효 ${subconItems.length}건 (만료 ${subconAll.length - subconItems.length}건 제외)`
  )

  // 트랜잭션으로 DELETE → INSERT (전체 교체)
  await sql.begin(async (tx) => {
    // 상습체불
    await tx`DELETE FROM kiscon_arrears`
    if (arrearsItems.length > 0) {
      const arrearsRows = arrearsItems.map((item) => ({
        company_name: item.companyName,
        address: item.address,
        representative: item.representative,
        penalty_history: item.penaltyHistory,
        arrears_amount: item.arrearsAmount,
        publication_period: item.publicationPeriod,
      }))
      await tx`INSERT INTO kiscon_arrears ${tx(arrearsRows)}`
    }
    console.log(`[kiscon-sync] kiscon_arrears: ${arrearsItems.length}건 저장`)

    // 하도급참여제한
    await tx`DELETE FROM kiscon_subcon_limits`
    if (subconItems.length > 0) {
      const subconRows = subconItems.map((item) => ({
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
      await tx`INSERT INTO kiscon_subcon_limits ${tx(subconRows)}`
    }
    console.log(`[kiscon-sync] kiscon_subcon_limits: ${subconItems.length}건 저장`)
  })

  const summary = [
    `✅ *KISCON 동기화 완료*`,
    `상습체불: ${arrearsItems.length}건`,
    `하도급참여제한: ${subconItems.length}건`,
  ].join('\n')

  console.log(`[kiscon-sync] ${summary}`)
  await notifySlack(summary)
  await sql.end({ timeout: 5 })
}

main().catch(async (err) => {
  console.error('[kiscon-sync] 실패:', err)
  await notifySlack(`🚨 *KISCON 동기화 실패*\n${err instanceof Error ? err.message : String(err)}`)
  await sql.end()
  process.exit(1)
})
