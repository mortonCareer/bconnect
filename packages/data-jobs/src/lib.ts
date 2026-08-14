import * as cheerio from 'cheerio'

import type { Sql } from './db'

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

export interface TableRow {
  texts: string[]
  href(index: number): string | null
}

export interface TableSpec<T> {
  source: string
  anchorHeader?: string
  requiredHeaders: string[]
  minCells: number
  map: (row: TableRow) => T | null
}

// HTML 표 파싱. null 행 제외
export function parseTable<T>(html: string, spec: TableSpec<T>): T[] {
  const $ = cheerio.load(html)
  const tables = $('table').toArray()

  const headersOf = (table: (typeof tables)[number]): string[] =>
    $(table)
      .find('th')
      .map((_i, th) => $(th).text().trim())
      .get()

  const hasRequired = (headers: string[]): boolean =>
    spec.requiredHeaders.every((required) => headers.some((actual) => actual.includes(required)))

  const target = spec.anchorHeader
    ? tables.find((table) => $(table).find('th').first().text().trim() === spec.anchorHeader)
    : tables.find((table) => hasRequired(headersOf(table)))

  if (!target || !hasRequired(headersOf(target))) {
    throw new Error(`${spec.source} table schema changed: ${tables.flatMap(headersOf).join(', ')}`)
  }

  const items: T[] = []
  $(target)
    .find('tbody tr')
    .each((_i, row) => {
      const cells = $(row).find('td')
      if (cells.length < spec.minCells) return

      const item = spec.map({
        texts: cells.map((_j, td) => $(td).text().trim()).get(),
        href: (index) => $(cells[index]).find('a').attr('href')?.trim() ?? null,
      })
      if (item != null) items.push(item)
    })

  return items
}

// 따옴표 필드 지원. 값에 쉼표가 있는 컬럼 대응
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

export interface CsvSpec<T> {
  source: string
  headerRows?: number
  minColumns: number
  map: (fields: string[]) => T | null
}

// CSV 파싱. null 행 제외
export function parseCsv<T>(text: string, spec: CsvSpec<T>): T[] {
  const lines = text.split('\n')
  const items: T[] = []
  let skipped = 0

  for (let i = spec.headerRows ?? 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCsvLine(line)
    if (fields.length < spec.minColumns) {
      skipped++
      continue
    }

    const item = spec.map(fields)
    if (item == null) {
      skipped++
      continue
    }
    items.push(item)
  }

  if (skipped > 0) {
    console.log(`[${spec.source}] 형식 불일치 ${skipped}행 제외`)
  }

  return items
}

// 응답 봉투 검증 (null일 경우 throw)
export function requireBody<T>(value: T | null | undefined, field: string, source: string): T {
  if (value == null) {
    throw new Error(`[${source}] 응답 봉투 누락: ${field}`)
  }
  return value
}

// 단일 객체 배열 정규화. 항목이 하나면 객체로, 없으면 빈 문자열로 오는 응답 대응
export function toArray<T>(value: T | T[] | null | undefined | ''): T[] {
  if (value == null || value === '') return []
  return Array.isArray(value) ? value : [value]
}

// 실행 환경 시간대와 무관하게 KST로 해석한다
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

// KST 기준 YYYYMMDD
export function formatYmd(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10).replace(/-/g, '')
}

// XXXX.XX.XX 또는 XXXX.XX 파싱. KST 자정 반환
export function parseDotted(text: string): Date | null {
  const day = text.match(/(\d{4})\.(\d{2})\.(\d{2})/)
  if (day) {
    const utc = Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
    return new Date(utc - KST_OFFSET_MS)
  }

  const month = text.match(/(\d{4})\.(\d{2})/)
  if (month) {
    const utc = Date.UTC(Number(month[1]), Number(month[2]) - 1, 1)
    return new Date(utc - KST_OFFSET_MS)
  }

  return null
}

// XXXX.XX ~ XXXX.XX 파싱. 종료월을 포함시키기 위해 다음 달 1일 KST 자정 반환
export function parsePeriodEnd(text: string): Date | null {
  const match = text.match(/~\s*(\d{4})\.(\d{2})/)
  if (!match) return null
  return new Date(Date.UTC(Number(match[1]), Number(match[2]), 1) - KST_OFFSET_MS)
}

// 파싱 실패는 보수적으로 유효 처리
export function isActiveOn(end: Date | null, baseDate: Date): boolean {
  if (!end) return true
  return end > baseDate
}

// (상법 제19조, 등기예규 제12조) 회사 종류 제거
const LEGAL_FORMS = [
  '유한책임회사',
  '농업회사법인',
  '사회복지법인',
  '주식회사',
  '유한회사',
  '합자회사',
  '합명회사',
  '사단법인',
  '재단법인',
  '의료법인',
  '학교법인',
]

// 등기부에는 쓸 수 없으나 실무 표기에 사용되는 약칭
const LEGAL_FORM_ABBR = /㈜|㈔|[(（]\s*(?:유한|합자|사단|재단|주|유|합|사|재|의|자)\s*[)）]/g

// 상호 오른쪽 끝 괄호 제거 (등기예규 제5조 제1항)
const TRAILING_PAREN = /\s*[(（][^(（)）]*[)）]\s*$/

// 법인격 표기와 로마자 등 병기를 제거하고 공백을 없앤다 (등기예규 제6조 제1항)
export function normalizeCompanyName(name: string): string {
  let result = name.replace(LEGAL_FORM_ABBR, '')
  while (TRAILING_PAREN.test(result)) {
    result = result.replace(TRAILING_PAREN, '')
  }
  for (const form of LEGAL_FORMS) {
    result = result.replaceAll(form, '')
  }
  result = result.replace(/\s+/g, '')

  // 법인격 표기만으로 이루어진 값은 정규화하면 비므로 원본을 유지한다
  return result || name.replace(/\s+/g, '')
}

// 사업자등록번호 정규화. 숫자 10자리가 아니면 null
export function normalizeBizRegNo(value: string | number): string | null {
  const digits = String(value).replace(/\D/g, '')
  return digits.length === 10 ? digits : null
}

// 텍스트값 정규화 (nullable)
export function toNullableText(value: string | number | null | undefined): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text ? text : null
}

// 텍스트값 정규화 (null일 경우 throw)
export function requireText(
  value: string | number | null | undefined,
  field: string,
  source: string
): string {
  const text = toNullableText(value)
  if (text == null) {
    throw new Error(`[${source}] 필수값 누락: ${field}`)
  }
  return text
}

// 숫자값 정규화 (null일 경우 throw)
export function requireNumber(
  value: number | null | undefined,
  field: string,
  source: string
): number {
  if (value == null || !Number.isFinite(value)) {
    throw new Error(`[${source}] 필수값 누락: ${field}`)
  }
  return value
}

// 슬랙 알림
export async function notifySlack(message: string): Promise<void> {
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

// 공통 처리
export function runSync(name: string, sql: Sql, main: () => Promise<void>): void {
  console.log(`[${name}] 시작: ${new Date().toISOString()}`)
  main()
    .then(() => sql.end({ timeout: 5 }))
    .catch(async (err) => {
      console.error(`[${name}] 실패:`, err)
      await notifySlack(`🚨 *${name} 실패*\n${err instanceof Error ? err.message : String(err)}`)
      await sql.end()
      process.exit(1)
    })
}
