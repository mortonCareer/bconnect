/**
 * 건설근로자공제회 퇴직공제 가입사업장 동기화 스크립트
 *
 * data.go.kr CSV 다운로드 → Railway Postgres
 * - cwma_retirement_fund 테이블에 전량 적재
 *
 * 실행: pnpm exec tsx scripts/cwma-retirement-sync.ts
 * 환경변수: DATABASE_URL, SLACK_WEBHOOK_URL (선택)
 */

import postgres from 'postgres'

// ─── 설정 ───────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

/** data.go.kr 퇴직공제 가입사업장 CSV 다운로드 URL */
const CSV_URL =
  'https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000003611389&fileDetailSn=1&insertDataPrcus=N'

const BATCH_SIZE = 500

if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

const sql = postgres(DATABASE_URL, { max: 5 })

// ─── DDL ────────────────────────────────────────

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS cwma_retirement_fund (
      id                      SERIAL PRIMARY KEY,
      project_name            TEXT NOT NULL,
      total_amount            NUMERIC,
      start_date              DATE,
      end_date                DATE,
      company_name            TEXT NOT NULL,
      normalized_company_name TEXT NOT NULL,
      client_org              TEXT,
      address                 TEXT,
      synced_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (company_name, project_name, start_date)
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_cwma_normalized_name
    ON cwma_retirement_fund (normalized_company_name)
  `
}

// ─── 업체명 정규화 ──────────────────────────────

/**
 * 업체명에서 법인격 표기를 제거하고 정규화
 * "(주)대윤기술공영" → "대윤기술공영"
 * "재성종합건설(주)" → "재성종합건설"
 * "주식회사 동성산업" → "동성산업"
 */
export function normalizeCompanyName(name: string): string {
  return name
    .replace(/\(주\)/g, '')
    .replace(/\(유\)/g, '')
    .replace(/\(합\)/g, '')
    .replace(/\(사\)/g, '')
    .replace(/주식회사/g, '')
    .replace(/유한회사/g, '')
    .replace(/합자회사/g, '')
    .replace(/합명회사/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

// ─── CSV 다운로드 및 파싱 ───────────────────────

interface CsvRow {
  projectName: string
  totalAmount: string
  startDate: string
  endDate: string
  companyName: string
  clientOrg: string
  address: string
}

async function downloadAndParseCsv(): Promise<CsvRow[]> {
  console.log('[csv] 다운로드 시작...')

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(CSV_URL, {
        signal: AbortSignal.timeout(120_000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MortonSync/1.0)',
        },
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }

      const buffer = await res.arrayBuffer()
      const decoder = new TextDecoder('euc-kr')
      const text = decoder.decode(buffer)

      console.log(`[csv] 다운로드 완료: ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB`)

      return parseCsvText(text)
    } catch (e) {
      lastError = e as Error
      const delay = Math.pow(2, attempt) * 2000
      console.warn(`[retry] CSV 다운로드 attempt ${attempt + 1} failed, waiting ${delay}ms`)
      await sleep(delay)
    }
  }
  throw lastError!
}

function parseCsvText(text: string): CsvRow[] {
  const lines = text.split('\n')
  const rows: CsvRow[] = []

  // 첫 줄은 헤더 — 스킵
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCsvLine(line)
    if (fields.length < 8) continue

    rows.push({
      projectName: fields[1],
      totalAmount: fields[2],
      startDate: fields[3],
      endDate: fields[4],
      companyName: fields[5],
      clientOrg: fields[6],
      address: fields[7],
    })
  }

  console.log(`[csv] 파싱 완료: ${rows.length}건`)
  return rows
}

/**
 * CSV 라인 파싱 — 따옴표로 감싼 필드 지원
 * 공사명에 쉼표가 포함될 수 있으므로 단순 split 불가
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++ // escaped quote
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

// ─── DB Upsert ──────────────────────────────────

async function upsertRows(rows: CsvRow[]): Promise<number> {
  let upserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const dbRows = batch
      .filter((r) => r.companyName && r.projectName)
      .map((r) => ({
        project_name: r.projectName,
        total_amount: r.totalAmount ? parseFloat(r.totalAmount) || null : null,
        start_date: r.startDate || null,
        end_date: r.endDate || null,
        company_name: r.companyName,
        normalized_company_name: normalizeCompanyName(r.companyName),
        client_org: r.clientOrg || null,
        address: r.address || null,
      }))

    if (dbRows.length === 0) continue

    // dedup: 같은 배치 내 동일 키 → 마지막 것만 유지
    const deduped = [
      ...new Map(
        dbRows.map((r) => [`${r.company_name}|${r.project_name}|${r.start_date}`, r])
      ).values(),
    ]

    const result = await sql`
      INSERT INTO cwma_retirement_fund ${sql(deduped)}
      ON CONFLICT (company_name, project_name, start_date) DO UPDATE SET
        total_amount = EXCLUDED.total_amount,
        end_date = EXCLUDED.end_date,
        normalized_company_name = EXCLUDED.normalized_company_name,
        client_org = EXCLUDED.client_org,
        address = EXCLUDED.address,
        synced_at = NOW()
    `
    upserted += result.count

    if ((i / BATCH_SIZE) % 10 === 0) {
      const pct = ((Math.min(i + BATCH_SIZE, rows.length) / rows.length) * 100).toFixed(1)
      console.log(`[upsert] ${pct}% (${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length})`)
    }
  }

  return upserted
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── 메인 ───────────────────────────────────────

async function main(): Promise<void> {
  console.log('[sync] 퇴직공제 가입사업장 동기화 시작')

  await ensureTable()

  const rows = await downloadAndParseCsv()
  if (rows.length === 0) {
    throw new Error('CSV에서 파싱된 데이터가 없습니다')
  }

  const upserted = await upsertRows(rows)
  console.log(`[sync] 완료: ${upserted}건 upserted (총 ${rows.length}건 파싱)`)

  // 고유 업체 수 집계
  const [{ count: companyCount }] = await sql`
    SELECT COUNT(DISTINCT normalized_company_name) as count
    FROM cwma_retirement_fund
  `

  const summary = [
    `✅ *퇴직공제 가입사업장 동기화 완료*`,
    `파싱: ${rows.length}건`,
    `Upserted: ${upserted}건`,
    `고유 업체: ${companyCount}개`,
  ].join('\n')

  console.log(summary)
  await notifySlack(summary)
  await sql.end({ timeout: 5 })
}

main().catch(async (err) => {
  console.error('[sync] 실패:', err)
  await notifySlack(
    `🚨 *퇴직공제 가입사업장 동기화 실패*\n${err instanceof Error ? err.message : String(err)}`
  )
  await sql.end()
  process.exit(1)
})
