# KISCON 건설업체정보 Postgres 동기화 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** data.go.kr KISCON 건설업체정보 API를 Railway Postgres에 주기적 동기화하고, career 앱 원클릭 조회에서 건설업 면허 및 행정처분 이력을 사업자등록번호로 조회한다.

**Architecture:** GitHub Actions cron job이 data.go.kr API를 페이지 순회하여 Railway Postgres에 INSERT/UPDATE. Career 앱(Vercel)은 postgres.js로 직접 쿼리. 초기 1회 전체 로딩 후 주간 증분.

**Tech Stack:** postgres (postgres.js), Next.js unstable_cache, GitHub Actions (morton-runner), Railway Postgres, Terraform

**Spec:** `docs/superpowers/specs/2026-03-13-kiscon-construction-api-sync-design.md`

---

## File Structure

### New Files

| File                                                                   | Responsibility                            |
| ---------------------------------------------------------------------- | ----------------------------------------- |
| `apps/career/src/lib/db.ts`                                            | postgres.js 싱글턴 DB 연결 인스턴스       |
| `apps/career/scripts/kiscon-construction-sync.ts`                      | data.go.kr API → Postgres 동기화 스크립트 |
| `apps/career/src/app/one-click/_clients/kiscon-construction-client.ts` | DB 조회 클라이언트 (server-only)          |
| `.github/workflows/kiscon-construction-sync.yml`                       | 주간 크론 워크플로우                      |

### Modified Files

| File                                                       | Change                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| `apps/career/package.json`                                 | `postgres` 의존성 추가                                       |
| `apps/career/src/app/one-click/_clients/types.ts`          | `KisconRegistrationItem`, `KisconAdminPenaltyItem` 타입 추가 |
| `apps/career/src/app/one-click/_clients/fetch-business.ts` | CONSTRUCTION_LICENSE 통합 (PENDING_ITEMS 제거, fetcher 추가) |
| `infra/railway/database.tf`                                | TCP proxy 설정 추가                                          |

---

## Chunk 1: Dependencies & DB Connection

### Task 1: Add postgres dependency

**Files:**

- Modify: `apps/career/package.json`

- [ ] **Step 1: Install postgres**

```bash
cd /home/json/morton-worktrees/kiscon-construction-sync
pnpm --filter morton-career add postgres
```

- [ ] **Step 2: Verify installation**

```bash
cd apps/career && node -e "require('postgres')" && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add apps/career/package.json pnpm-lock.yaml
git commit -m "chore(career): add postgres.js dependency"
```

### Task 2: Create DB connection singleton

**Files:**

- Create: `apps/career/src/lib/db.ts`

- [ ] **Step 1: Create db.ts**

```typescript
import 'server-only'

import postgres from 'postgres'

let _sql: ReturnType<typeof postgres> | null = null

export function getDb() {
  if (!_sql) {
    const url = process.env.RAILWAY_DATABASE_URL
    if (!url) {
      throw new Error('RAILWAY_DATABASE_URL is not configured')
    }
    _sql = postgres(url, {
      max: 3,
      idle_timeout: 10,
      max_lifetime: 60 * 5,
      connection: {
        application_name: 'morton-career',
      },
    })
  }
  return _sql
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/career/src/lib/db.ts
git commit -m "feat(career): add postgres.js DB connection singleton"
```

---

## Chunk 2: Types

### Task 3: Add KISCON construction types

**Files:**

- Modify: `apps/career/src/app/one-click/_clients/types.ts`

- [ ] **Step 1: Add types at the end of types.ts**

Append after the `KcomwelInsuranceItem` interface (after line 134):

```typescript
// ─── KISCON 건설업체정보 API Types ───────────────

/** 건설업체등록 레코드 (kiscon_registration 테이블) */
export interface KisconRegistrationItem {
  ncr_gs_seq: number
  biz_reg_no: string
  company_name: string | null
  representative: string | null
  trade_name: string | null
  trade_reg_no: string | null
  address: string | null
  region: string | null
  region_detail: string | null
  reg_date: number | null
  announce_date: number | null
  flag: string | null
  phone: string | null
  synced_at: string
}

/** 행정처분 레코드 (kiscon_admin_penalty 테이블) */
export interface KisconAdminPenaltyItem {
  ncr_gs_seq: number
  biz_reg_no: string
  company_name: string | null
  representative: string | null
  trade_name: string | null
  trade_reg_no: string | null
  address: string | null
  region: string | null
  region_detail: string | null
  penalty_type: string | null
  violation_content: string | null
  violation_detail: string | null
  penalty_ground: string | null
  fine_amount: number
  penalty_amount: number
  stop_start_date: string | null
  stop_end_date: string | null
  cancel_date: string | null
  correction: string | null
  penalty_date: number | null
  announce_date: number | null
  flag: string | null
  phone: string | null
  has_injunction: string | null
  synced_at: string
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/career/src/app/one-click/_clients/types.ts
git commit -m "feat(career): add KISCON construction registration/penalty types"
```

---

## Chunk 3: Sync Script

### Task 4: Create the sync script

**Files:**

- Create: `apps/career/scripts/kiscon-construction-sync.ts`

- [ ] **Step 1: Create the sync script**

```typescript
/**
 * KISCON 건설업체정보 동기화 스크립트
 *
 * data.go.kr API → Railway Postgres
 * - GongsiReg (건설업체등록) → kiscon_registration
 * - GongsiAdmi (행정처분) → kiscon_admin_penalty
 *
 * 실행: pnpm exec tsx scripts/kiscon-construction-sync.ts [--full]
 * 환경변수: KISCON_API_SERVICE_KEY, RAILWAY_DATABASE_URL, SLACK_WEBHOOK_URL (선택)
 */

import postgres from 'postgres'

// ─── 설정 ───────────────────────────────────────

const DATABASE_URL = process.env.RAILWAY_DATABASE_URL
const API_KEY = process.env.KISCON_API_SERVICE_KEY
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
const BASE_URL = 'https://apis.data.go.kr/1613000/ConAdminInfoSvc1'
const PAGE_SIZE = 1000
const REQUEST_DELAY_MS = 100

if (!DATABASE_URL) throw new Error('RAILWAY_DATABASE_URL is required')
if (!API_KEY) throw new Error('KISCON_API_SERVICE_KEY is required')

const sql = postgres(DATABASE_URL, { max: 5 })

// ─── DDL ────────────────────────────────────────

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

// ─── API 호출 ───────────────────────────────────

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
        signal: AbortSignal.timeout(15_000),
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
      if (!body.items || body.items === '') return { items: [], totalCount: body.totalCount }

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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── biz_reg_no 정규화 ─────────────────────────

function normalizeBizRegNo(value: number | string): string {
  return String(value).padStart(10, '0')
}

// ─── GongsiReg 동기화 ──────────────────────────

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
    if (items.length === 0) return
    const rows = items.map((r) => ({
      ncr_gs_seq: r.ncrGsSeq,
      biz_reg_no: normalizeBizRegNo(r.ncrMasterNum),
      company_name: r.ncrGsKname,
      representative: r.ncrGsMaster,
      trade_name: r.ncrItemName,
      trade_reg_no: r.ncrItemregno,
      address: r.ncrGsAddr,
      region: r.ncrAreaName,
      region_detail: r.ncrAreaDetailName,
      reg_date: r.ncrGsDate,
      announce_date: r.ncrGsRegdate,
      flag: r.ncrGsFlag,
      phone: r.ncrOffTel,
    }))

    const result = await sql`
      INSERT INTO kiscon_registration ${sql(rows)}
      ON CONFLICT (ncr_gs_seq) DO UPDATE SET
        flag = EXCLUDED.flag,
        announce_date = EXCLUDED.announce_date,
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

// ─── GongsiAdmi 동기화 ─────────────────────────

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
    if (items.length === 0) return
    const rows = items.map((r) => ({
      ncr_gs_seq: r.ncrGsSeq,
      biz_reg_no: normalizeBizRegNo(r.ncrMasterNum),
      company_name: r.ncrAdmiKname,
      representative: r.ncrAdmiMaster,
      trade_name: r.ncrItemName,
      trade_reg_no: r.ncrItemregno,
      address: r.ncrAdmiAddr,
      region: r.ncrAreaName,
      region_detail: r.ncrAreaDetailName,
      penalty_type: r.ncrAdmiDename,
      violation_content: r.ecodeAdmiCon,
      violation_detail: r.ncrAdmiReason,
      penalty_ground: r.ecodeAdmiGround,
      fine_amount: r.ncrAdmiFine,
      penalty_amount: r.ncrAdmiPenalty,
      stop_start_date: r.ncrAdmiStopSdate,
      stop_end_date: r.ncrAdmiStopEdate,
      cancel_date: r.ncrAdmiCanceldate,
      correction: r.ncrAdmiCorrect,
      penalty_date: r.ncrGsDate,
      announce_date: r.ncrGsRegdate,
      flag: r.ncrGsFlag,
      phone: r.ncrOffTel,
      has_injunction: r.ncrPdStatus,
    }))

    const result = await sql`
      INSERT INTO kiscon_admin_penalty ${sql(rows)}
      ON CONFLICT (ncr_gs_seq) DO UPDATE SET
        flag = EXCLUDED.flag,
        announce_date = EXCLUDED.announce_date,
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
  await sql.end({ timeout: 5 })
}

main().catch(async (err) => {
  console.error('[sync] 실패:', err)
  await notifySlack(
    `🚨 *KISCON 건설업체정보 동기화 실패*\n${err instanceof Error ? err.message : String(err)}`
  )
  await sql.end()
  process.exit(1)
})
```

- [ ] **Step 2: Test locally with a small date range (dry run)**

```bash
cd apps/career
KISCON_API_SERVICE_KEY=3ba3461167dcbdd9c733b43457ddd5714589b3cec592ab0bae445d159e067710 \
RAILWAY_DATABASE_URL="<railway-url>" \
pnpm exec tsx scripts/kiscon-construction-sync.ts
```

Expected: incremental mode runs, creates tables, inserts recent data.

- [ ] **Step 3: Commit**

```bash
git add apps/career/scripts/kiscon-construction-sync.ts
git commit -m "feat(career): add KISCON construction API → Postgres sync script"
```

---

## Chunk 4: DB Query Client

### Task 5: Create construction client

**Files:**

- Create: `apps/career/src/app/one-click/_clients/kiscon-construction-client.ts`

- [ ] **Step 1: Create the client**

```typescript
import 'server-only'

import { getDb } from '../../../lib/db'
import type { KisconRegistrationItem, KisconAdminPenaltyItem } from './types'

/**
 * 건설업 면허 등록 조회
 * @param bizRegNo 사업자등록번호 (10자리, 하이픈 없음)
 */
export async function fetchConstructionLicense(
  bizRegNo: string
): Promise<KisconRegistrationItem[]> {
  const sql = getDb()
  const rows = await sql<KisconRegistrationItem[]>`
    SELECT * FROM kiscon_registration
    WHERE biz_reg_no = ${bizRegNo}
    ORDER BY reg_date DESC
  `
  return rows
}

/**
 * 행정처분 이력 조회
 * @param bizRegNo 사업자등록번호 (10자리, 하이픈 없음)
 */
export async function fetchConstructionAdminPenalty(
  bizRegNo: string
): Promise<KisconAdminPenaltyItem[]> {
  const sql = getDb()
  const rows = await sql<KisconAdminPenaltyItem[]>`
    SELECT * FROM kiscon_admin_penalty
    WHERE biz_reg_no = ${bizRegNo}
    ORDER BY penalty_date DESC
  `
  return rows
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/career/src/app/one-click/_clients/kiscon-construction-client.ts
git commit -m "feat(career): add KISCON construction DB query client"
```

---

## Chunk 5: CheckItem Integration

### Task 6: Wire into fetch-business.ts

**Files:**

- Modify: `apps/career/src/app/one-click/_clients/fetch-business.ts`

- [ ] **Step 1: Add imports**

At the top of the file, after the existing imports (around line 19), add:

```typescript
import {
  fetchConstructionLicense,
  fetchConstructionAdminPenalty,
} from './kiscon-construction-client'
import type { KisconRegistrationItem, KisconAdminPenaltyItem } from './types'
```

- [ ] **Step 2: Add cached wrappers**

After the existing `cachedKisconSubcon` definition (around line 51), add:

```typescript
const cachedConstructionLicense = unstable_cache(
  fetchConstructionLicense,
  ['one-click-construction-license'],
  { revalidate: CACHE_TTL }
)

const cachedConstructionPenalty = unstable_cache(
  fetchConstructionAdminPenalty,
  ['one-click-construction-penalty'],
  { revalidate: CACHE_TTL }
)
```

- [ ] **Step 3: Add mapper functions**

Before the `PENDING_ITEMS` section (before line 302), add:

```typescript
// ─── KISCON 건설업 면허 → CheckItem ─────────────

function mapConstructionLicenseToCheckItem(
  regItems: KisconRegistrationItem[],
  penaltyItems: KisconAdminPenaltyItem[]
): CheckItem {
  const hasLicense = regItems.length > 0
  const hasPenalty = penaltyItems.length > 0
  const first = regItems[0]

  let status: string
  let statusType: CheckItem['statusType']

  if (!hasLicense) {
    status = '미확인'
    statusType = 'neutral'
  } else if (hasPenalty) {
    status = `등록 ${regItems.length}건 / 행정처분 ${penaltyItems.length}건`
    statusType = 'negative'
  } else {
    status = `${regItems.length}건 확인`
    statusType = 'positive'
  }

  const details: CheckItem['details'] = []

  if (hasLicense) {
    details.push(
      { key: '업체명', value: first.company_name || '-' },
      { key: '대표자', value: first.representative || '-' },
      { key: '등록업종', value: first.trade_name || '-' },
      {
        key: '등록일',
        value: first.reg_date ? formatDate(String(first.reg_date)) : '-',
      },
      { key: '소재지', value: first.address || '-' }
    )
  }

  if (hasPenalty) {
    const p = penaltyItems[0]
    details.push(
      { key: '행정처분', value: p.penalty_type || '-' },
      {
        key: '과태료',
        value: p.penalty_amount ? `${p.penalty_amount.toLocaleString()}원` : '-',
      },
      { key: '위반내용', value: p.violation_content || '-' }
    )
  }

  return {
    id: 'CONSTRUCTION_LICENSE',
    category: 'BUSINESS_LICENSE',
    label: '건설업 면허',
    source: '국토교통부',
    status,
    statusType,
    description: '국토교통부 KISCON 기준 건설업 면허 등록 및 행정처분 현황이에요.',
    details,
  }
}
```

- [ ] **Step 4: Add fetcher function**

After the `fetchHabitualArrearsItem` function (around line 465), add:

```typescript
async function fetchConstructionLicenseItem(regNo: string): Promise<CheckItem> {
  try {
    const [regItems, penaltyItems] = await Promise.all([
      cachedConstructionLicense(regNo),
      cachedConstructionPenalty(regNo),
    ])
    return mapConstructionLicenseToCheckItem(regItems, penaltyItems)
  } catch (e) {
    Sentry.captureException(e, { tags: { source: 'kiscon-construction' }, extra: { regNo } })
    console.error('KISCON construction query failed:', e)
    return makeErrorItem('CONSTRUCTION_LICENSE', 'BUSINESS_LICENSE', '건설업 면허', '국토교통부')
  }
}
```

- [ ] **Step 5: Remove CONSTRUCTION_LICENSE from PENDING_ITEMS**

Delete the `CONSTRUCTION_LICENSE` block from the `PENDING_ITEMS` object (lines 303-311).

- [ ] **Step 6: Add case to fetchCheckItemById switch**

In the `fetchCheckItemById` function's switch statement (around line 483), add before `default:`:

```typescript
      case 'CONSTRUCTION_LICENSE':
        return fetchConstructionLicenseItem(regNo)
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /home/json/morton-worktrees/kiscon-construction-sync
pnpm --filter morton-career exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add apps/career/src/app/one-click/_clients/fetch-business.ts
git commit -m "feat(career): integrate construction license into one-click CheckItem"
```

---

## Chunk 6: GitHub Actions Workflow

### Task 7: Create sync workflow

**Files:**

- Create: `.github/workflows/kiscon-construction-sync.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: KISCON Construction Sync

on:
  schedule:
    # 매주 월요일 01:00 UTC (10:00 KST) — 기존 kiscon-sync와 1시간 차이
    - cron: '0 1 * * 1'
  workflow_dispatch:
    inputs:
      full:
        description: 'Full sync (2003~present)'
        required: false
        default: 'false'
        type: boolean

jobs:
  sync:
    runs-on: morton-runner
    defaults:
      run:
        working-directory: apps/career
    steps:
      - uses: actions/checkout@v6

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        working-directory: .

      - name: Sync KISCON construction data to Postgres
        env:
          KISCON_API_SERVICE_KEY: ${{ secrets.KISCON_API_SERVICE_KEY }}
          RAILWAY_DATABASE_URL: ${{ secrets.RAILWAY_DATABASE_URL }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: |
          if [ "${{ inputs.full }}" = "true" ]; then
            pnpm exec tsx scripts/kiscon-construction-sync.ts --full
          else
            pnpm exec tsx scripts/kiscon-construction-sync.ts
          fi

      - name: Notify Slack on failure
        if: failure()
        run: |
          curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d '{"text":"🚨 *KISCON Construction Sync 실패*\n<https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}|워크플로우 로그 확인>"}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/kiscon-construction-sync.yml
git commit -m "ci: add KISCON construction data sync workflow"
```

---

## Chunk 7: Infrastructure

### Task 8: Railway TCP proxy (Terraform)

**Files:**

- Modify: `infra/railway/database.tf`

- [ ] **Step 1: Add TCP proxy resource**

Append to `infra/railway/database.tf`:

```hcl
resource "railway_tcp_proxy" "postgres" {
  service_id     = railway_service.postgres.id
  environment_id = railway_project.morton.default_environment.id
  application_port = 5432
}
```

Note: Railway Terraform provider의 TCP proxy 지원 여부를 확인해야 함. 미지원 시 Railway GUI에서 수동으로 Public Networking 활성화.

- [ ] **Step 2: Commit**

```bash
git add infra/railway/database.tf
git commit -m "infra: add Railway Postgres TCP proxy for external access"
```

### Task 9: Configure secrets & env vars (manual)

- [ ] **Step 1: Add GitHub Secrets**

GitHub repo Settings → Secrets → Actions:

- `KISCON_API_SERVICE_KEY`: `3ba3461167dcbdd9c733b43457ddd5714589b3cec592ab0bae445d159e067710`
- `RAILWAY_DATABASE_URL`: Railway TCP proxy URL (format: `postgresql://morton:<pw>@<host>:<port>/morton?sslmode=require`)

- [ ] **Step 2: Add Vercel env var**

Vercel Dashboard → career project → Settings → Environment Variables:

- `RAILWAY_DATABASE_URL`: same value as GitHub Secret

- [ ] **Step 3: Run initial full sync**

Trigger workflow manually with `full=true`:

```bash
gh workflow run kiscon-construction-sync.yml -f full=true
```

Or run locally:

```bash
KISCON_API_SERVICE_KEY=<key> RAILWAY_DATABASE_URL=<url> \
pnpm exec tsx scripts/kiscon-construction-sync.ts --full
```

---

## Chunk 8: GitHub Issues (후순위)

### Task 10: Create follow-up issues

- [ ] **Step 1: Create issues**

```bash
gh issue create --title "feat: KISCON 폐업신고(GongsiCess) 동기화" \
  --body "kiscon_registration에 등록된 업체 중 폐업 신고된 건을 추적. ~90K건." \
  --label "☁️ infra"

gh issue create --title "feat: KISCON 등록기준사항신고(GongsiRenew) 동기화" \
  --body "건설업체 등록기준사항 변경 이력 추적. ~369K건." \
  --label "☁️ infra"

gh issue create --title "feat: KISCON 양도/합병/상속 신고 동기화" \
  --body "GongsiTrans(~5.5K), GongsiUnion(~2.3K), GongsiInheri(~177) 동기화." \
  --label "☁️ infra"

gh issue create --title "feat: KISCON 행정처분 가처분(GongsiAdmiPD) 상세 연동" \
  --body "GongsiAdmi의 ncrGsSeq로 가처분 상세 조회. 행정처분 카드에 가처분 내용 표시." \
  --label "💻 FE"
```

- [ ] **Step 2: Commit (no code changes)**

No commit needed for this task.
