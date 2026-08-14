// 고용노동부 체불사업주 명단 크롤링 → moel_wage_defaults (전체 교체)

import { createDb, replaceAll } from './db'
import { fetchHtml, withPage, withRetry } from './http'
import { normalizeCompanyName, notifySlack, parseTable, requireText, runSync } from './lib'

const MOEL_DEFAULTER_URL = 'https://moel.go.kr/info/defaulter/defaulterList.do'
const PAGE_UNIT = 100

const sql = createDb()

interface MoelDefaulterItem {
  period: string
  name: string
  age: string
  companyName: string
  industry: string
  personalAddress: string
  companyAddress: string
  arrearsAmount: string
}

async function main() {
  console.log('[moel-sync] 체불사업주 명단 크롤링...')
  const items = await withPage('moel-sync', async (page) => {
    const html = await withRetry(() =>
      fetchHtml(MOEL_DEFAULTER_URL, { form: { pageIndex: page, pageUnit: PAGE_UNIT } })
    )

    return {
      items: parseTable<MoelDefaulterItem>(html, {
        source: 'MOEL defaulter',
        requiredHeaders: ['구분', '성명', '나이', '사업장명', '업종'],
        minCells: 8,
        map: ({ texts }) => ({
          period: texts[0],
          name: texts[1],
          age: texts[2],
          companyName: texts[3],
          industry: texts[4],
          personalAddress: texts[5],
          companyAddress: texts[6],
          arrearsAmount: texts[7],
        }),
      }),
    }
  })
  console.log(`[moel-sync] 총 ${items.length}건 수집`)

  await sql.begin(async (tx) => {
    await replaceAll(
      tx,
      'moel_wage_defaults',
      items.map((item) => ({
        period: requireText(item.period, 'period', 'moel-sync'),
        name: requireText(item.name, 'name', 'moel-sync'),
        age: requireText(item.age, 'age', 'moel-sync'),
        company_name: requireText(item.companyName, 'company_name', 'moel-sync'),
        normalized_company_name: normalizeCompanyName(item.companyName),
        industry: requireText(item.industry, 'industry', 'moel-sync'),
        personal_address: requireText(item.personalAddress, 'personal_address', 'moel-sync'),
        company_address: requireText(item.companyAddress, 'company_address', 'moel-sync'),
        arrears_amount: requireText(item.arrearsAmount, 'arrears_amount', 'moel-sync'),
      }))
    )
    console.log(`[moel-sync] moel_wage_defaults: ${items.length}건 저장`)
  })

  const summary = [`✅ *MOEL 동기화 완료*`, `체불사업주: ${items.length}건`].join('\n')
  console.log(`[moel-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('moel-sync', sql, main)
