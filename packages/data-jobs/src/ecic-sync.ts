// 한국전기공사협회 전기공사업체 크롤링 → ecic_electrical_licenses (이름 기반, 전체 교체)

import { createDb, replaceAll } from './db'
import { fetchHtml, withPage, withRetry } from './http'
import { normalizeCompanyName, notifySlack, parseTable, requireText, runSync } from './lib'

const ECIC_URL = 'https://www.keca.or.kr/ecic/ad/ad0101.do'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const sql = createDb()

interface EcicItem {
  registrationNo: string
  companyName: string
  representative: string
  address: string
}

async function main() {
  console.log('[ecic-sync] 전기공사업체 전체목록 크롤링...')
  const items = await withPage('ecic-sync', async (page) => {
    const html = await withRetry(() =>
      fetchHtml(ECIC_URL, {
        query: { menuCd: 6047, currentPageNo: page },
        headers: { 'User-Agent': USER_AGENT },
      })
    )

    return {
      items: parseTable<EcicItem>(html, {
        source: 'ECIC',
        requiredHeaders: ['등록번호'],
        minCells: 4,
        map: ({ texts }) => {
          const [registrationNo, companyName, representative, address] = texts
          return { registrationNo, companyName, representative, address }
        },
      }),
    }
  })
  console.log(`[ecic-sync] 총 ${items.length}건 수집`)

  await sql.begin(async (tx) => {
    await replaceAll(
      tx,
      'ecic_electrical_licenses',
      items.map((item) => ({
        registration_no: requireText(item.registrationNo, 'registration_no', 'ecic-sync'),
        company_name: requireText(item.companyName, 'company_name', 'ecic-sync'),
        normalized_company_name: normalizeCompanyName(item.companyName),
        representative: requireText(item.representative, 'representative', 'ecic-sync'),
        address: requireText(item.address, 'address', 'ecic-sync'),
      }))
    )
    console.log(`[ecic-sync] ecic_electrical_licenses: ${items.length}건 저장`)
  })

  const summary = [`✅ *ECIC 동기화 완료*`, `전기공사업체: ${items.length}건`].join('\n')
  console.log(`[ecic-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('ecic-sync', sql, main)
