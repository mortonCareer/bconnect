// KISCON 건설업체등록 → kiscon_registration (증분 upsert)
// 실행: pnpm --filter @bconnect/data-jobs kiscon-registration-sync [--full]

import { createDb, upsertAll } from './db'
import { fetchJson, withPage, withRetry } from './http'
import {
  formatYmd,
  normalizeBizRegNo,
  normalizeCompanyName,
  notifySlack,
  requireBody,
  requireNumber,
  requireText,
  runSync,
  toArray,
} from './lib'

const API_KEY = process.env.DATA_GO_SERVICE_KEY
const OPERATION = 'GongsiReg'
const OPERATION_URL = `https://apis.data.go.kr/1613000/ConAdminInfoSvc1/${OPERATION}`
const PAGE_SIZE = 1000
const FULL_START_DATE = '20030101'
const INCREMENTAL_DAYS = 7

if (!API_KEY) throw new Error('DATA_GO_SERVICE_KEY is required')

const sql = createDb()

interface ApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string }
    body: {
      items: { item: RegItem | RegItem[] } | ''
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

interface RegItem {
  ncrGsSeq: number
  ncrMasterNum: number | string | null
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
  ncrGsNumber: string
  ncrGsReason: string
}

async function main() {
  const isFull = process.argv.includes('--full')
  const now = new Date()
  const eDate = formatYmd(now)
  const sDate = isFull
    ? FULL_START_DATE
    : formatYmd(new Date(now.getTime() - INCREMENTAL_DAYS * 24 * 60 * 60 * 1000))
  const mode = `${isFull ? '전체' : '증분'} 모드: ${sDate} ~ ${eDate}`
  console.log(`[kiscon-registration-sync] ${mode}`)

  const items = await withPage('kiscon-registration-sync', (page) =>
    withRetry(async () => {
      const data = await fetchJson<ApiResponse>(OPERATION_URL, {
        query: {
          serviceKey: API_KEY!,
          pageNo: page,
          numOfRows: PAGE_SIZE,
          sDate,
          eDate,
          _type: 'json',
        },
        timeoutMs: 60_000,
      })

      const envelope = requireBody(data.response, 'response', OPERATION)
      if (envelope.header.resultCode !== '00') {
        throw new Error(`API error: ${envelope.header.resultCode} ${envelope.header.resultMsg}`)
      }

      const body = requireBody(envelope.body, 'response.body', OPERATION)
      return {
        items: toArray(body.items === '' ? null : body.items?.item),
        totalCount: body.totalCount,
      }
    })
  )
  console.log(`[kiscon-registration-sync] 총 ${items.length}건 수집`)

  // 사업자등록번호가 없거나 형식에 안 맞으면 해당 행 적재 생략
  const validated = items.flatMap((item) => {
    const ncrGsSeq = requireNumber(item.ncrGsSeq, 'ncr_gs_seq', OPERATION)
    const masterNum = item.ncrMasterNum == null ? null : normalizeBizRegNo(item.ncrMasterNum)
    return masterNum == null ? [] : [{ item, ncrGsSeq, masterNum }]
  })

  const skipped = items.length - validated.length
  const skipNote = skipped > 0 ? `ncr_master_num 결측 ${skipped}행 적재 생략` : null
  if (skipNote) console.log(`[kiscon-registration-sync] ${skipNote}`)

  // 동일 PK 중복 응답은 마지막 레코드만 유지
  const deduped = [...new Map(validated.map((it) => [it.ncrGsSeq, it])).values()]

  const rows = deduped.map(({ item, masterNum }) => {
    const gsKname = requireText(item.ncrGsKname, 'ncr_gs_kname', OPERATION)

    return {
      ncr_gs_seq: item.ncrGsSeq,
      ncr_master_num: masterNum,
      ncr_gs_kname: gsKname,
      normalized_company_name: normalizeCompanyName(gsKname),
      ncr_gs_master: requireText(item.ncrGsMaster, 'ncr_gs_master', OPERATION),
      ncr_item_name: requireText(item.ncrItemName, 'ncr_item_name', OPERATION),
      ncr_itemregno: requireText(item.ncrItemregno, 'ncr_itemregno', OPERATION),
      ncr_gs_addr: requireText(item.ncrGsAddr, 'ncr_gs_addr', OPERATION),
      ncr_area_name: requireText(item.ncrAreaName, 'ncr_area_name', OPERATION),
      ncr_area_detail_name: requireText(item.ncrAreaDetailName, 'ncr_area_detail_name', OPERATION),
      ncr_gs_date: requireNumber(item.ncrGsDate, 'ncr_gs_date', OPERATION),
      ncr_gs_regdate: requireNumber(item.ncrGsRegdate, 'ncr_gs_regdate', OPERATION),
      ncr_gs_flag: requireText(item.ncrGsFlag, 'ncr_gs_flag', OPERATION),
      ncr_off_tel: requireText(item.ncrOffTel, 'ncr_off_tel', OPERATION),
      ncr_gs_number: requireText(item.ncrGsNumber, 'ncr_gs_number', OPERATION),
      ncr_gs_reason: requireText(item.ncrGsReason, 'ncr_gs_reason', OPERATION),
    }
  })

  const count = await upsertAll(sql, 'kiscon_registration', rows, 'ncr_gs_seq')
  console.log(`[kiscon-registration-sync] kiscon_registration: ${count}건 upserted`)

  const summary = [
    `✅ *KISCON 건설업체등록 동기화 완료*`,
    mode,
    `건설업체등록: ${count}건`,
    skipNote,
  ]
    .filter(Boolean)
    .join('\n')
  console.log(`[kiscon-registration-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('kiscon-registration-sync', sql, main)
