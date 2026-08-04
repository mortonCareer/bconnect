// 소방청 소방시설업 현황 (data.go.kr odcloud) → feia_fire_licenses (이름 기반, 전체 교체)

import { createDb, replaceAll } from './db'
import { fetchJson, withPage, withRetry } from './http'
import {
  normalizeCompanyName,
  notifySlack,
  requireBody,
  requireNumber,
  requireText,
  runSync,
  toNullableText,
} from './lib'

const API_KEY = process.env.DATA_GO_SERVICE_KEY

// 소방청_소방시설업 현황(15052730), uddi는 연간 갱신
const FEIA_URL = 'https://api.odcloud.kr/api/15052730/v1/uddi:c98ecfc6-4d3f-4a26-b981-d57e749fa5ae'
const PER_PAGE = 1000

if (!API_KEY) throw new Error('DATA_GO_SERVICE_KEY is required')

const sql = createDb()

interface FeiaItem {
  seqNo: number
  companyName: string
  ceoName: string | null
  address: string
  businessType: string
  licenseDiv: string
  postalCode: string
  phone: string | null
  region: string
  regionDetail: string
}

async function main() {
  console.log('[feia-sync] 소방시설업 현황 조회...')
  const items = await withPage('feia-sync', async (page) => {
    const body = await withRetry(() =>
      fetchJson<{ data?: Array<Record<string, string | number>> }>(FEIA_URL, {
        query: { serviceKey: API_KEY!, page, perPage: PER_PAGE, returnType: 'JSON' },
      })
    )

    const data = requireBody(body.data, 'data', 'feia-sync')

    return {
      items: data.map((it): FeiaItem => {
        const seqText = toNullableText(it['순번'])
        return {
          seqNo: requireNumber(seqText != null ? Number(seqText) : NaN, 'seq_no', 'feia-sync'),
          companyName: requireText(it['상호'], 'company_name', 'feia-sync'),
          ceoName: toNullableText(it['대표자']),
          address: requireText(it['본사주소'], 'address', 'feia-sync'),
          businessType: requireText(it['업종'], 'business_type', 'feia-sync'),
          licenseDiv: requireText(it['분야'], 'license_div', 'feia-sync'),
          postalCode: requireText(it['우편번호'], 'postal_code', 'feia-sync'),
          phone: toNullableText(it['전화번호']),
          region: requireText(it['지역'], 'region', 'feia-sync'),
          regionDetail: requireText(it['조회지역'], 'region_detail', 'feia-sync'),
        }
      }),
    }
  })
  console.log(`[feia-sync] 총 ${items.length}건 수집`)

  const nullCeoCount = items.filter((item) => item.ceoName == null).length
  const nullCeoNote = nullCeoCount > 0 ? `ceo_name 결측 ${nullCeoCount}행 null 저장` : null
  if (nullCeoNote) console.log(`[feia-sync] ${nullCeoNote}`)

  await sql.begin(async (tx) => {
    await replaceAll(
      tx,
      'feia_fire_licenses',
      items.map((item) => {
        return {
          seq_no: item.seqNo,
          company_name: item.companyName,
          normalized_company_name: normalizeCompanyName(item.companyName),
          ceo_name: item.ceoName,
          address: item.address,
          business_type: item.businessType,
          license_div: item.licenseDiv,
          postal_code: item.postalCode,
          phone: item.phone,
          region: item.region,
          region_detail: item.regionDetail,
        }
      })
    )
    console.log(`[feia-sync] feia_fire_licenses: ${items.length}건 저장`)
  })

  const summary = [`✅ *FEIA 동기화 완료*`, `소방시설업체: ${items.length}건`, nullCeoNote]
    .filter(Boolean)
    .join('\n')
  console.log(`[feia-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('feia-sync', sql, main)
