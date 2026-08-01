// 건설근로자공제회 퇴직공제 가입사업장 CSV(data.go.kr) → cwma_retirement_fund (이름 기반, 전체 교체)

import { createDb, insertBatched, notifySlack, runSync } from './lib'

const CSV_URL =
  process.env.CWMA_CSV_URL ||
  'https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000003611389&fileDetailSn=1&insertDataPrcus=N'

const sql = createDb()

interface CwmaItem {
  projectName: string
  totalAmount: number | null
  startDate: string | null
  endDate: string | null
  companyName: string
  clientOrg: string | null
  address: string | null
}

// BE CwmaRetirementFinder.normalize 와 동일: 법인격 표기 제거 후 공백 정규화
function normalizeCompanyName(name: string): string {
  return name
    .replace(/\(주\)|\(유\)|\(합\)|\(사\)/g, '')
    .replace(/주식회사/g, '')
    .replace(/유한회사/g, '')
    .replace(/합자회사/g, '')
    .replace(/합명회사/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

async function downloadCsv(): Promise<string> {
  const response = await fetch(CSV_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MortonSync/1.0)' },
    signal: AbortSignal.timeout(120_000),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from CWMA CSV`)
  }
  const buffer = await response.arrayBuffer()
  console.log(`[cwma-sync] 다운로드 완료: ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB`)
  return new TextDecoder('euc-kr').decode(buffer)
}

// 공사명에 쉼표가 있을 수 있어 따옴표 필드 지원
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

function parseCsv(text: string): CwmaItem[] {
  const lines = text.split('\n')
  const items: CwmaItem[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCsvLine(line)
    if (fields.length < 8) continue
    if (!fields[5] || !fields[1]) continue // 업체명·공사명 필수

    const amount = parseFloat(fields[2])
    items.push({
      projectName: fields[1],
      totalAmount: Number.isFinite(amount) ? amount : null,
      startDate: fields[3] || null,
      endDate: fields[4] || null,
      companyName: fields[5],
      clientOrg: fields[6] || null,
      address: fields[7] || null,
    })
  }

  console.log(`[cwma-sync] 파싱 완료: ${items.length}건`)
  return items
}

async function main() {
  console.log('[cwma-sync] 퇴직공제 가입사업장 CSV 크롤링...')
  const items = parseCsv(await downloadCsv())
  console.log(`[cwma-sync] 총 ${items.length}건 수집`)

  await sql.begin(async (tx) => {
    await tx`DELETE FROM cwma_retirement_fund`
    await insertBatched(
      tx,
      'cwma_retirement_fund',
      items.map((item) => ({
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

  const summary = `✅ *CWMA 동기화 완료*\n퇴직공제 가입사업장: ${items.length}건`
  console.log(`[cwma-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('cwma-sync', sql, main)
