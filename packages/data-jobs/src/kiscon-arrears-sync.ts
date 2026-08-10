// KISCON 상습체불 크롤링 → kiscon_arrears (전체 교체)

import * as cheerio from 'cheerio'

import { createDb, replaceAll } from './db'
import { fetchHtml, withPage, withRetry } from './http'
import {
  isActiveOn,
  normalizeCompanyName,
  notifySlack,
  parsePeriodEnd,
  parseTable,
  requireText,
  runSync,
  toNullableText,
} from './lib'

const KISCON_ARREARS_URL = 'https://kiscon.net/cis/coad_arrearsnotice.asp'

const sql = createDb()

interface KisconArrearsItem {
  seqNo: string // 연번
  companyName: string // 법인 명칭
  address: string // 법인 주소
  representative: string // 대표자 성명
  representativeAge: string // 대표자 나이
  representativeAddress: string // 대표자 주소
  penaltyHistory: string // 처분이력
  penaltyDates: string // 처분일자
  arrearsAmount: string // 체불금액(천원)
  publicationPeriod: string // 공표기간
}

async function main() {
  console.log('[kiscon-arrears-sync] 상습체불 크롤링...')
  const all = await withPage('kiscon-arrears-sync', async (page) => {
    const html = await withRetry(() => fetchHtml(KISCON_ARREARS_URL, { form: { GotoPage: page } }))

    const items = parseTable<KisconArrearsItem>(html, {
      source: 'KISCON arrears',
      anchorHeader: '연번',
      requiredHeaders: ['연번', '명칭', '처분이력', '체불금액', '공표기간'],
      minCells: 10,
      map: ({ texts }) => ({
        seqNo: texts[0],
        companyName: texts[1],
        address: texts[2],
        representative: texts[3],
        representativeAge: texts[4],
        representativeAddress: texts[5],
        penaltyHistory: texts[6],
        penaltyDates: texts[7],
        arrearsAmount: texts[8],
        publicationPeriod: texts[9],
      }),
    })

    // totalcnt 가 없으면 항목 수로 대체
    const totalCount = Number(cheerio.load(html)('input[name="totalcnt"]').val())
    return { items, totalCount: totalCount || items.length }
  })

  // 공표기간 만료분 제외
  const now = new Date()
  const items = all.filter((item) => isActiveOn(parsePeriodEnd(item.publicationPeriod), now))
  console.log(
    `[kiscon-arrears-sync] 총 ${all.length}건 중 유효 ${items.length}건, 만료 ${all.length - items.length}건 제외`
  )

  await sql.begin(async (tx) => {
    await replaceAll(
      tx,
      'kiscon_arrears',
      items.map((item) => ({
        seq_no: requireText(item.seqNo, 'seq_no', 'kiscon-arrears-sync'),
        company_name: requireText(item.companyName, 'company_name', 'kiscon-arrears-sync'),
        normalized_company_name: normalizeCompanyName(item.companyName),
        address: requireText(item.address, 'address', 'kiscon-arrears-sync'),
        representative: requireText(item.representative, 'representative', 'kiscon-arrears-sync'),
        representative_age: requireText(
          item.representativeAge,
          'representative_age',
          'kiscon-arrears-sync'
        ),
        representative_address: toNullableText(item.representativeAddress),
        penalty_history: requireText(item.penaltyHistory, 'penalty_history', 'kiscon-arrears-sync'),
        penalty_dates: requireText(item.penaltyDates, 'penalty_dates', 'kiscon-arrears-sync'),
        arrears_amount: requireText(item.arrearsAmount, 'arrears_amount', 'kiscon-arrears-sync'),
        publication_period: requireText(
          item.publicationPeriod,
          'publication_period',
          'kiscon-arrears-sync'
        ),
      }))
    )
    console.log(`[kiscon-arrears-sync] kiscon_arrears: ${items.length}건 저장`)
  })

  const summary = [`✅ *KISCON 상습체불 동기화 완료*`, `상습체불: ${items.length}건`].join('\n')
  console.log(`[kiscon-arrears-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('kiscon-arrears-sync', sql, main)
