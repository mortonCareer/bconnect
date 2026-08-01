// 소방청 소방시설업 현황 (data.go.kr odcloud) → feia_fire_licenses (이름 기반, 전체 교체)

import { createDb, insertBatched, notifySlack, runSync, sleep } from './lib'

const API_KEY = process.env.FEIA_API_SERVICE_KEY
// 소방청_소방시설업 현황(15052730). uddi는 연간 갱신 — 최신(2024-12-31) 사용
const FEIA_URL = 'https://api.odcloud.kr/api/15052730/v1/uddi:c98ecfc6-4d3f-4a26-b981-d57e749fa5ae'
const PER_PAGE = 1000
const REQUEST_DELAY_MS = 100
const MAX_PAGES = 100

if (!API_KEY) throw new Error('FEIA_API_SERVICE_KEY is required')

const sql = createDb()

interface FeiaItem {
  companyName: string
  ceoName: string | null
  address: string | null
  licenseDiv: string | null
}

async function fetchPage(page: number): Promise<FeiaItem[]> {
  const url = new URL(FEIA_URL)
  url.searchParams.set('serviceKey', API_KEY!)
  url.searchParams.set('page', String(page))
  url.searchParams.set('perPage', String(PER_PAGE))
  url.searchParams.set('returnType', 'JSON')

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from FEIA odcloud`)
  }
  const body = (await response.json()) as { data?: Array<Record<string, string>> }
  if (!body.data) {
    throw new Error('FEIA odcloud: no data field')
  }
  return body.data.map((it) => ({
    companyName: it['상호'],
    ceoName: it['대표자'] ?? null,
    address: it['본사주소'] ?? null,
    licenseDiv: it['분야'] ?? null, // 전문/일반 (등록번호는 소방청 데이터에 없음)
  }))
}

async function fetchAll(): Promise<FeiaItem[]> {
  const all: FeiaItem[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const items = await fetchPage(page)
    if (items.length === 0) break
    all.push(...items.filter((it) => it.companyName))
    console.log(`[feia-sync]   page ${page}: ${items.length}건 (누적 ${all.length})`)
    if (items.length < PER_PAGE) break // 마지막 페이지
    await sleep(REQUEST_DELAY_MS)
  }
  return all
}

async function main() {
  console.log('[feia-sync] 소방시설업 현황 조회...')
  const items = await fetchAll()
  console.log(`[feia-sync] 총 ${items.length}건 수집`)

  await sql.begin(async (tx) => {
    await tx`DELETE FROM feia_fire_licenses`
    await insertBatched(
      tx,
      'feia_fire_licenses',
      items.map((item) => ({
        company_name: item.companyName,
        ceo_name: item.ceoName,
        address: item.address,
        license_div: item.licenseDiv,
      }))
    )
    console.log(`[feia-sync] feia_fire_licenses: ${items.length}건 저장`)
  })

  const summary = `✅ *FEIA 동기화 완료*\n소방시설업체: ${items.length}건`
  console.log(`[feia-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('feia-sync', sql, main)
