// KISCON 행정처분 (data.go.kr ConAdminInfoSvc1/GongsiAdmi) → kiscon_admin_penalty (증분 upsert)
// 실행: pnpm --filter @bconnect/data-jobs kiscon-penalty-sync [--full]

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
  toNullableText,
} from './lib'

const API_KEY = process.env.DATA_GO_SERVICE_KEY
const OPERATION = 'GongsiAdmi'
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
      items: { item: AdmiItem | AdmiItem[] } | ''
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

interface AdmiItem {
  ncrGsSeq: number
  ncrMasterNum: number | string | null
  ncrAdmiKname: string | null
  ncrAdmiMaster: string | null
  ncrItemName: string
  ncrItemregno: string
  ncrAdmiAddr: string | null
  ncrAreaName: string
  ncrAreaDetailName: string
  ncrAdmiDename: string | null
  ecodeAdmiCon: string | null
  ncrAdmiReason: string | null
  ecodeAdmiGround: string | null
  ncrAdmiFine: number | null
  ncrAdmiPenalty: number | null
  ncrAdmiStopSdate: string | null
  ncrAdmiStopEdate: string | null
  ncrAdmiCanceldate: string | null
  ncrAdmiCorrect: string | null
  ncrGsDate: number
  ncrGsRegdate: number
  ncrGsFlag: string
  ncrOffTel: string
  ncrPdStatus: string | null
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
  console.log(`[kiscon-penalty-sync] ${mode}`)

  const items = await withPage('kiscon-penalty-sync', (page) =>
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
  console.log(`[kiscon-penalty-sync] 총 ${items.length}건 수집`)

  // 사업자등록번호가 없거나 형식에 안 맞으면 해당 행 적재 생략
  const validated = items.flatMap((item) => {
    const ncrGsSeq = requireNumber(item.ncrGsSeq, 'ncr_gs_seq', OPERATION)
    const masterNum = item.ncrMasterNum == null ? null : normalizeBizRegNo(item.ncrMasterNum)
    return masterNum == null ? [] : [{ item, ncrGsSeq, masterNum }]
  })

  // 동일 PK 중복 응답은 마지막 레코드만 유지
  const deduped = [...new Map(validated.map((it) => [it.ncrGsSeq, it])).values()]

  const rows = deduped.map(({ item, masterNum }) => {
    const admiKname = toNullableText(item.ncrAdmiKname)

    return {
      ncr_gs_seq: item.ncrGsSeq,
      ncr_master_num: masterNum,
      ncr_admi_kname: admiKname,
      normalized_company_name: admiKname == null ? null : normalizeCompanyName(admiKname),
      ncr_admi_master: toNullableText(item.ncrAdmiMaster),
      ncr_item_name: requireText(item.ncrItemName, 'ncr_item_name', OPERATION),
      ncr_itemregno: requireText(item.ncrItemregno, 'ncr_itemregno', OPERATION),
      ncr_admi_addr: toNullableText(item.ncrAdmiAddr),
      ncr_area_name: requireText(item.ncrAreaName, 'ncr_area_name', OPERATION),
      ncr_area_detail_name: requireText(item.ncrAreaDetailName, 'ncr_area_detail_name', OPERATION),
      ncr_admi_dename: toNullableText(item.ncrAdmiDename),
      ecode_admi_con: toNullableText(item.ecodeAdmiCon),
      ncr_admi_reason: toNullableText(item.ncrAdmiReason),
      ecode_admi_ground: toNullableText(item.ecodeAdmiGround),
      ncr_admi_fine: item.ncrAdmiFine ?? null,
      ncr_admi_penalty: item.ncrAdmiPenalty ?? null,
      ncr_admi_stop_sdate: toNullableText(item.ncrAdmiStopSdate),
      ncr_admi_stop_edate: toNullableText(item.ncrAdmiStopEdate),
      ncr_admi_canceldate: toNullableText(item.ncrAdmiCanceldate),
      ncr_admi_correct: toNullableText(item.ncrAdmiCorrect),
      ncr_gs_date: requireNumber(item.ncrGsDate, 'ncr_gs_date', OPERATION),
      ncr_gs_regdate: requireNumber(item.ncrGsRegdate, 'ncr_gs_regdate', OPERATION),
      ncr_gs_flag: requireText(item.ncrGsFlag, 'ncr_gs_flag', OPERATION),
      ncr_off_tel: requireText(item.ncrOffTel, 'ncr_off_tel', OPERATION),
      ncr_pd_status: toNullableText(item.ncrPdStatus),
      ncr_gs_number: requireText(item.ncrGsNumber, 'ncr_gs_number', OPERATION),
      ncr_gs_reason: requireText(item.ncrGsReason, 'ncr_gs_reason', OPERATION),
    }
  })

  const skipped = items.length - validated.length
  const knameNulls = rows.filter((row) => row.ncr_admi_kname == null).length
  const masterNulls = rows.filter((row) => row.ncr_admi_master == null).length
  const skipNote = skipped > 0 ? `ncr_master_num 결측 ${skipped}행 적재 생략` : null
  const knameNote = knameNulls > 0 ? `ncr_admi_kname 결측 ${knameNulls}행 null 저장` : null
  const masterNote = masterNulls > 0 ? `ncr_admi_master 결측 ${masterNulls}행 null 저장` : null
  for (const note of [skipNote, knameNote, masterNote]) {
    if (note) console.log(`[kiscon-penalty-sync] ${note}`)
  }

  const count = await upsertAll(sql, 'kiscon_admin_penalty', rows, 'ncr_gs_seq')
  console.log(`[kiscon-penalty-sync] kiscon_admin_penalty: ${count}건 upserted`)

  const summary = [
    `✅ *KISCON 행정처분 동기화 완료*`,
    mode,
    `행정처분: ${count}건`,
    skipNote,
    knameNote,
    masterNote,
  ]
    .filter(Boolean)
    .join('\n')
  console.log(`[kiscon-penalty-sync] ${summary}`)
  await notifySlack(summary)
}

runSync('kiscon-penalty-sync', sql, main)
