import { NextResponse } from 'next/server'
import { fetchNtsBusinessStatus } from '@/app/one-click/_clients/nts-client'
import { fetchKcomwelInsurance } from '@/app/one-click/_clients/kcomwel-client'
import { fetchFeiaCompanies } from '@/app/one-click/_clients/feia-client'
import { fetchMoelDefaulters } from '@/app/one-click/_clients/moel-client'
import {
  fetchKisconArrears,
  fetchKisconSubconLimit,
} from '@/app/one-click/_clients/kiscon-crawl-client'

// 더미 사업자번호 — 존재 여부와 무관하게 API 응답 자체를 검증
const DUMMY_BIZ_NO = '0000000000'

const HEALTH_TARGETS = [
  // API 헬스체크
  { name: 'NTS 사업자상태', fn: () => fetchNtsBusinessStatus([DUMMY_BIZ_NO]) },
  { name: 'KCOMWEL 고용보험', fn: () => fetchKcomwelInsurance(DUMMY_BIZ_NO) },
  { name: 'FEIA 소방시설업', fn: () => fetchFeiaCompanies('__health_check__') },
  // 크롤링 스키마 검증
  { name: 'MOEL 체불사업주', fn: () => fetchMoelDefaulters('__schema_check__') },
  { name: 'KISCON 상습체불', fn: () => fetchKisconArrears('__schema_check__') },
  { name: 'KISCON 하도급제한', fn: () => fetchKisconSubconLimit(DUMMY_BIZ_NO) },
]

async function sendSlackAlert(failures: string[]) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 *원클릭 조회 헬스체크 실패*\n\n${failures.join('\n')}`,
    }),
  })
}

export async function GET(request: Request) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await Promise.allSettled(HEALTH_TARGETS.map((t) => t.fn()))

  const failures: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      failures.push(`❌ ${HEALTH_TARGETS[i].name}: ${result.reason?.message ?? result.reason}`)
    }
  })

  if (failures.length > 0) {
    await sendSlackAlert(failures)
    return NextResponse.json({ ok: false, failures }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    checked: HEALTH_TARGETS.map((t) => t.name),
  })
}
