// KISCON 하도급참여제한 크롤링 → kiscon_subcon_limits (전체 교체)

import * as cheerio from 'cheerio'

import { createDb, replaceAll } from './db'
import { fetchHtml, withPage, withRetry } from './http'
import {
  isActiveOn,
  normalizeBizRegNo,
  normalizeCompanyName,
  notifySlack,
  parseDotted,
  parseTable,
  requireText,
  runSync,
  toNullableText,
} from './lib'

const KISCON_SUBCON_URL = 'https://kiscon.net/cis/coad_subcon_limit_list.asp'

const sql = createDb()

interface KisconSubconLimitItem {
  seqNo: string // 연번
  violationType: string // 위반법령
  companyName: string // 상호
  corpNo: string // 법인번호
  bizRegNo: string // 사업자번호
  representative: string // 대표자
  restrictionStart: string // 하도급참여제한 시작일
  restrictionEnd: string // 하도급참여제한 종료일
  category: string // 구분
  announcementDate: string // 게재일
  certificateUrl: string | null // 참여제한 확인서 다운로드
  note: string | null // 비고
}

async function main() {
  console.log('[kiscon-subcon-sync] 하도급참여제한 크롤링...')
  const all = await withPage('kiscon-subcon-sync', async (page) => {
    const html = await withRetry(() => fetchHtml(KISCON_SUBCON_URL, { form: { GotoPage: page } }))

    const items = parseTable<KisconSubconLimitItem>(html, {
      source: 'KISCON subcon',
      anchorHeader: '연번',
      requiredHeaders: ['연번', '위반법령', '상호', '법인번호', '사업자번호', '대표자'],
      minCells: 10,
      map: ({ texts, href }) => ({
        seqNo: texts[0],
        violationType: texts[1],
        companyName: texts[2],
        corpNo: texts[3],
        bizRegNo: texts[4],
        representative: texts[5],
        restrictionStart: texts[6],
        restrictionEnd: texts[7],
        category: texts[8],
        announcementDate: texts[9],
        certificateUrl: href(10),
        note: texts[11] ?? null,
      }),
    })

    // totalcnt 가 없으면 항목 수로 대체
    const totalCount = Number(cheerio.load(html)('input[name="totalcnt"]').val())
    return { items, totalCount: totalCount || items.length }
  })

  // 제한종료일 만료분 제외
  const now = new Date()
  const active = all.filter((item) => isActiveOn(parseDotted(item.restrictionEnd), now))
  console.log(
    `[kiscon-subcon-sync] 총 ${all.length}건 중 유효 ${active.length}건, 만료 ${all.length - active.length}건 제외`
  )

  const items = active.filter((item) => normalizeBizRegNo(item.bizRegNo) != null)
  const skipped = active.length - items.length
  const skipNote = skipped > 0 ? `biz_reg_no 결측 ${skipped}행 적재 생략` : null
  if (skipNote) console.log(`[kiscon-subcon-sync] ${skipNote}`)

  await sql.begin(async (tx) => {
    await replaceAll(
      tx,
      'kiscon_subcon_limits',
      items.map((item) => ({
        seq_no: requireText(item.seqNo, 'seq_no', 'kiscon-subcon-sync'),
        violation_type: requireText(item.violationType, 'violation_type', 'kiscon-subcon-sync'),
        company_name: requireText(item.companyName, 'company_name', 'kiscon-subcon-sync'),
        normalized_company_name: normalizeCompanyName(item.companyName),
        corp_no: toNullableText(item.corpNo),
        biz_reg_no: requireText(
          normalizeBizRegNo(item.bizRegNo),
          'biz_reg_no',
          'kiscon-subcon-sync'
        ),
        representative: requireText(item.representative, 'representative', 'kiscon-subcon-sync'),
        restriction_start: requireText(
          item.restrictionStart,
          'restriction_start',
          'kiscon-subcon-sync'
        ),
        restriction_end: requireText(item.restrictionEnd, 'restriction_end', 'kiscon-subcon-sync'),
        category: requireText(item.category, 'category', 'kiscon-subcon-sync'),
        announcement_date: requireText(
          item.announcementDate,
          'announcement_date',
          'kiscon-subcon-sync'
        ),
        certificate_url: toNullableText(item.certificateUrl),
        note: toNullableText(item.note),
      }))
    )
    console.log(`[kiscon-subcon-sync] kiscon_subcon_limits: ${items.length}건 저장`)
  })

  const summary = [
    `✅ *KISCON 하도급참여제한 동기화 완료*`,
    `하도급참여제한: ${items.length}건`,
    skipNote,
  ]
    .filter(Boolean)
    .join('\n')
  console.log(`[kiscon-subcon-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('kiscon-subcon-sync', sql, main)
