// 건설근로자공제회 퇴직공제 가입사업장 CSV(data.go.kr) → cwma_retirement_fund (이름 기반, 전체 교체)

import { createDb, replaceAll } from './db'
import { fetchCsv } from './http'
import {
  normalizeCompanyName,
  notifySlack,
  parseCsv,
  requireNumber,
  requireText,
  runSync,
} from './lib'

const CSV_URL =
  process.env.CWMA_CSV_URL ||
  'https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000003611389&fileDetailSn=1&insertDataPrcus=N'

const sql = createDb()

interface CwmaItem {
  seqNo: number
  projectName: string
  totalAmount: number
  startDate: string
  endDate: string
  companyName: string
  clientOrg: string
  address: string
}

async function main() {
  console.log('[cwma-sync] 퇴직공제 가입사업장 CSV 크롤링...')
  const text = await fetchCsv(CSV_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MortonSync/1.0)' },
    timeoutMs: 120_000,
    encoding: 'euc-kr',
  })

  const items = parseCsv<CwmaItem>(text, {
    source: 'cwma-sync',
    minColumns: 8,
    map: (fields) => {
      const seq = parseInt(fields[0], 10)
      const amount = parseFloat(fields[2])
      return {
        seqNo: requireNumber(seq, 'seq_no', 'cwma-sync'),
        projectName: requireText(fields[1], 'project_name', 'cwma-sync'),
        totalAmount: requireNumber(amount, 'total_amount', 'cwma-sync'),
        startDate: requireText(fields[3], 'start_date', 'cwma-sync'),
        endDate: requireText(fields[4], 'end_date', 'cwma-sync'),
        companyName: requireText(fields[5], 'company_name', 'cwma-sync'),
        clientOrg: requireText(fields[6], 'client_org', 'cwma-sync'),
        address: requireText(fields[7], 'address', 'cwma-sync'),
      }
    },
  })
  console.log(`[cwma-sync] 총 ${items.length}건 수집`)

  await sql.begin(async (tx) => {
    await replaceAll(
      tx,
      'cwma_retirement_fund',
      items.map((item) => ({
        seq_no: item.seqNo,
        project_name: item.projectName,
        total_amount: item.totalAmount,
        start_date: item.startDate,
        end_date: item.endDate,
        company_name: item.companyName,
        normalized_company_name: normalizeCompanyName(item.companyName),
        client_org: item.clientOrg,
        address: item.address,
      }))
    )
    console.log(`[cwma-sync] cwma_retirement_fund: ${items.length}건 저장`)
  })

  const summary = [`✅ *CWMA 동기화 완료*`, `퇴직공제 가입사업장: ${items.length}건`].join('\n')
  console.log(`[cwma-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('cwma-sync', sql, main)
