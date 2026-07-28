// KISCON 건설업체등록·행정처분 (data.go.kr API) → kiscon_registration / kiscon_admin_penalty
// 실행: pnpm --filter @bconnect/data-jobs kiscon-construction-sync [--full]

import { createDb, notifySlack, runSync, sleep } from './lib'

const API_KEY = process.env.KISCON_API_SERVICE_KEY
const BASE_URL = 'https://apis.data.go.kr/1613000/ConAdminInfoSvc1'
const PAGE_SIZE = 1000
const REQUEST_DELAY_MS = 100

if (!API_KEY) throw new Error('KISCON_API_SERVICE_KEY is required')

const sql = createDb()

async function ensureTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS kiscon_registration (
      ncr_gs_seq      BIGINT PRIMARY KEY,
      biz_reg_no      TEXT NOT NULL,
      company_name    TEXT,
      representative  TEXT,
      trade_name      TEXT,
      trade_reg_no    TEXT,
      address         TEXT,
      region          TEXT,
      region_detail   TEXT,
      reg_date        INTEGER,
      announce_date   INTEGER,
      flag            TEXT,
      phone           TEXT,
      synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_kiscon_reg_biz_no
    ON kiscon_registration (biz_reg_no)
  `

  await sql`
    CREATE TABLE IF NOT EXISTS kiscon_admin_penalty (
      ncr_gs_seq        BIGINT PRIMARY KEY,
      biz_reg_no        TEXT NOT NULL,
      company_name      TEXT,
      representative    TEXT,
      trade_name        TEXT,
      trade_reg_no      TEXT,
      address           TEXT,
      region            TEXT,
      region_detail     TEXT,
      penalty_type      TEXT,
      violation_content TEXT,
      violation_detail  TEXT,
      penalty_ground    TEXT,
      fine_amount       BIGINT DEFAULT 0,
      penalty_amount    BIGINT DEFAULT 0,
      stop_start_date   TEXT,
      stop_end_date     TEXT,
      cancel_date       TEXT,
      correction        TEXT,
      penalty_date      INTEGER,
      announce_date     INTEGER,
      flag              TEXT,
      phone             TEXT,
      has_injunction    TEXT,
      synced_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_kiscon_admi_biz_no
    ON kiscon_admin_penalty (biz_reg_no)
  `
}

interface ApiResponse<T> {
  response: {
    header: { resultCode: string; resultMsg: string }
    body: {
      items: { item: T | T[] } | ''
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

async function fetchPage<T>(
  operation: string,
  sDate: string,
  eDate: string,
  pageNo: number
): Promise<{ items: T[]; totalCount: number }> {
  const url = new URL(`${BASE_URL}/${operation}`)
  url.searchParams.set('serviceKey', API_KEY!)
  url.searchParams.set('pageNo', String(pageNo))
  url.searchParams.set('numOfRows', String(PAGE_SIZE))
  url.searchParams.set('sDate', sDate)
  url.searchParams.set('eDate', eDate)
  url.searchParams.set('_type', 'json')

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(60_000),
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }
      const data = (await res.json()) as ApiResponse<T>

      if (data.response.header.resultCode !== '00') {
        throw new Error(
          `API error: ${data.response.header.resultCode} ${data.response.header.resultMsg}`
        )
      }

      const body = data.response.body
      if (!body.items) return { items: [], totalCount: body.totalCount }

      const raw = body.items.item
      const items = Array.isArray(raw) ? raw : [raw]
      return { items, totalCount: body.totalCount }
    } catch (e) {
      lastError = e as Error
      const delay = Math.pow(2, attempt) * 1000
      console.warn(
        `[retry] ${operation} page ${pageNo} attempt ${attempt + 1} failed, waiting ${delay}ms`
      )
      await sleep(delay)
    }
  }
  throw lastError!
}

function normalizeBizRegNo(value: number | string): string {
  return String(value).padStart(10, '0')
}

interface RawRegItem {
  ncrGsSeq: number
  ncrMasterNum: number | string
  ncrGsKname: string
  ncrGsMaster: string
  ncrItemName: string
  ncrItemregno: string
  ncrGsAddr: string
  ncrAreaName: string
  ncrAreaDetailName: string
  ncrGsDate: number
  ncrGsRegdate: number
  ncrGsFlag: string
  ncrOffTel: string
}

async function syncRegistration(sDate: string, eDate: string): Promise<number> {
  let upserted = 0

  const { items: firstItems, totalCount } = await fetchPage<RawRegItem>(
    'GongsiReg',
    sDate,
    eDate,
    1
  )
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  console.log(`[GongsiReg] totalCount=${totalCount}, pages=${totalPages}`)

  async function upsertBatch(items: RawRegItem[]): Promise<void> {
    // 사업자번호 없는 레코드는 조회 생략
    const valid = items.filter((r) => r.ncrMasterNum)
    if (valid.length === 0) return
    // 동일 PK 중복 응답 가능 → 마지막 레코드만 유지
    const deduped = [...new Map(valid.map((r) => [r.ncrGsSeq, r])).values()]
    const rows = deduped.map((r) => ({
      ncr_gs_seq: r.ncrGsSeq,
      biz_reg_no: normalizeBizRegNo(r.ncrMasterNum),
      company_name: r.ncrGsKname ?? null,
      representative: r.ncrGsMaster ?? null,
      trade_name: r.ncrItemName ?? null,
      trade_reg_no: r.ncrItemregno ?? null,
      address: r.ncrGsAddr ?? null,
      region: r.ncrAreaName ?? null,
      region_detail: r.ncrAreaDetailName ?? null,
      reg_date: r.ncrGsDate ?? null,
      announce_date: r.ncrGsRegdate ?? null,
      flag: r.ncrGsFlag ?? null,
      phone: r.ncrOffTel ?? null,
    }))

    const result = await sql`
      INSERT INTO kiscon_registration ${sql(rows)}
      ON CONFLICT (ncr_gs_seq) DO UPDATE SET
        biz_reg_no = EXCLUDED.biz_reg_no,
        company_name = EXCLUDED.company_name,
        representative = EXCLUDED.representative,
        trade_name = EXCLUDED.trade_name,
        trade_reg_no = EXCLUDED.trade_reg_no,
        address = EXCLUDED.address,
        region = EXCLUDED.region,
        region_detail = EXCLUDED.region_detail,
        reg_date = EXCLUDED.reg_date,
        announce_date = EXCLUDED.announce_date,
        flag = EXCLUDED.flag,
        phone = EXCLUDED.phone,
        synced_at = NOW()
    `
    upserted += result.count
  }

  await upsertBatch(firstItems)
  console.log(`[GongsiReg] page 1/${totalPages}`)

  for (let page = 2; page <= totalPages; page++) {
    await sleep(REQUEST_DELAY_MS)
    const { items } = await fetchPage<RawRegItem>('GongsiReg', sDate, eDate, page)
    await upsertBatch(items)
    const pct = ((page / totalPages) * 100).toFixed(1)
    console.log(`[GongsiReg] page ${page}/${totalPages} (${pct}%)`)
  }

  return upserted
}

interface RawAdmiItem {
  ncrGsSeq: number
  ncrMasterNum: number | string
  ncrAdmiKname: string
  ncrAdmiMaster: string
  ncrItemName: string
  ncrItemregno: string
  ncrAdmiAddr: string
  ncrAreaName: string
  ncrAreaDetailName: string
  ncrAdmiDename: string
  ecodeAdmiCon: string
  ncrAdmiReason: string
  ecodeAdmiGround: string
  ncrAdmiFine: number
  ncrAdmiPenalty: number
  ncrAdmiStopSdate: string
  ncrAdmiStopEdate: string
  ncrAdmiCanceldate: string
  ncrAdmiCorrect: string
  ncrGsDate: number
  ncrGsRegdate: number
  ncrGsFlag: string
  ncrOffTel: string
  ncrPdStatus: string
}

async function syncAdminPenalty(sDate: string, eDate: string): Promise<number> {
  let upserted = 0

  const { items: firstItems, totalCount } = await fetchPage<RawAdmiItem>(
    'GongsiAdmi',
    sDate,
    eDate,
    1
  )
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  console.log(`[GongsiAdmi] totalCount=${totalCount}, pages=${totalPages}`)

  async function upsertBatch(items: RawAdmiItem[]): Promise<void> {
    const valid = items.filter((r) => r.ncrMasterNum)
    if (valid.length === 0) return
    // 동일 PK 중복 응답 가능 → 마지막 레코드만 유지
    const deduped = [...new Map(valid.map((r) => [r.ncrGsSeq, r])).values()]
    const rows = deduped.map((r) => ({
      ncr_gs_seq: r.ncrGsSeq,
      biz_reg_no: normalizeBizRegNo(r.ncrMasterNum),
      company_name: r.ncrAdmiKname ?? null,
      representative: r.ncrAdmiMaster ?? null,
      trade_name: r.ncrItemName ?? null,
      trade_reg_no: r.ncrItemregno ?? null,
      address: r.ncrAdmiAddr ?? null,
      region: r.ncrAreaName ?? null,
      region_detail: r.ncrAreaDetailName ?? null,
      penalty_type: r.ncrAdmiDename ?? null,
      violation_content: r.ecodeAdmiCon ?? null,
      violation_detail: r.ncrAdmiReason ?? null,
      penalty_ground: r.ecodeAdmiGround ?? null,
      fine_amount: r.ncrAdmiFine ?? 0,
      penalty_amount: r.ncrAdmiPenalty ?? 0,
      stop_start_date: r.ncrAdmiStopSdate ?? null,
      stop_end_date: r.ncrAdmiStopEdate ?? null,
      cancel_date: r.ncrAdmiCanceldate ?? null,
      correction: r.ncrAdmiCorrect ?? null,
      penalty_date: r.ncrGsDate ?? null,
      announce_date: r.ncrGsRegdate ?? null,
      flag: r.ncrGsFlag ?? null,
      phone: r.ncrOffTel ?? null,
      has_injunction: r.ncrPdStatus ?? null,
    }))

    const result = await sql`
      INSERT INTO kiscon_admin_penalty ${sql(rows)}
      ON CONFLICT (ncr_gs_seq) DO UPDATE SET
        biz_reg_no = EXCLUDED.biz_reg_no,
        company_name = EXCLUDED.company_name,
        representative = EXCLUDED.representative,
        trade_name = EXCLUDED.trade_name,
        trade_reg_no = EXCLUDED.trade_reg_no,
        address = EXCLUDED.address,
        region = EXCLUDED.region,
        region_detail = EXCLUDED.region_detail,
        penalty_type = EXCLUDED.penalty_type,
        violation_content = EXCLUDED.violation_content,
        violation_detail = EXCLUDED.violation_detail,
        penalty_ground = EXCLUDED.penalty_ground,
        fine_amount = EXCLUDED.fine_amount,
        penalty_amount = EXCLUDED.penalty_amount,
        stop_start_date = EXCLUDED.stop_start_date,
        stop_end_date = EXCLUDED.stop_end_date,
        cancel_date = EXCLUDED.cancel_date,
        correction = EXCLUDED.correction,
        penalty_date = EXCLUDED.penalty_date,
        announce_date = EXCLUDED.announce_date,
        flag = EXCLUDED.flag,
        phone = EXCLUDED.phone,
        has_injunction = EXCLUDED.has_injunction,
        synced_at = NOW()
    `
    upserted += result.count
  }

  await upsertBatch(firstItems)
  console.log(`[GongsiAdmi] page 1/${totalPages}`)

  for (let page = 2; page <= totalPages; page++) {
    await sleep(REQUEST_DELAY_MS)
    const { items } = await fetchPage<RawAdmiItem>('GongsiAdmi', sDate, eDate, page)
    await upsertBatch(items)
    const pct = ((page / totalPages) * 100).toFixed(1)
    console.log(`[GongsiAdmi] page ${page}/${totalPages} (${pct}%)`)
  }

  return upserted
}

function formatDateParam(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

async function main(): Promise<void> {
  const isFull = process.argv.includes('--full')
  const now = new Date()
  const eDate = formatDateParam(now)

  let sDate: string
  if (isFull) {
    sDate = '20030101'
    console.log(`[sync] 전체 모드: ${sDate} ~ ${eDate}`)
  } else {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    sDate = formatDateParam(weekAgo)
    console.log(`[sync] 증분 모드: ${sDate} ~ ${eDate}`)
  }

  await ensureTables()

  const regCount = await syncRegistration(sDate, eDate)
  console.log(`[GongsiReg] 완료: ${regCount}건 upserted`)

  const admiCount = await syncAdminPenalty(sDate, eDate)
  console.log(`[GongsiAdmi] 완료: ${admiCount}건 upserted`)

  const summary = [
    `✅ *KISCON 건설업체정보 동기화 완료*`,
    `모드: ${isFull ? '전체' : '증분'} (${sDate} ~ ${eDate})`,
    `건설업체등록: ${regCount}건`,
    `행정처분: ${admiCount}건`,
  ].join('\n')

  console.log(summary)
  await notifySlack(summary)
}

runSync('kiscon-construction-sync', sql, main)
