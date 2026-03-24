import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { fetchNtsBusinessStatus } from '@/app/one-click/_clients/nts-client'
import { fetchKcomwelInsurance } from '@/app/one-click/_clients/kcomwel-client'
import { fetchFeiaCompanies } from '@/app/one-click/_clients/feia-client'
import { fetchMoelDefaulters } from '@/app/one-click/_clients/moel-client'
import { checkKisconFreshness } from '@/app/one-click/_clients/kiscon-db-client'

// 더미 사업자번호 — 존재 여부와 무관하게 API 응답 자체를 검증
const DUMMY_BIZ_NO = '0000000000'

const HEALTH_TARGETS = [
  // API 헬스체크
  { name: 'NTS 사업자상태', fn: () => fetchNtsBusinessStatus([DUMMY_BIZ_NO]) },
  { name: 'KCOMWEL 고용보험', fn: () => fetchKcomwelInsurance(DUMMY_BIZ_NO) },
  { name: 'FEIA 소방시설업', fn: () => fetchFeiaCompanies('__health_check__') },
  // 크롤링 스키마 검증
  { name: 'MOEL 체불사업주', fn: () => fetchMoelDefaulters('__schema_check__') },
  // DB 데이터 freshness 체크 (14일 이내)
  { name: 'KISCON DB 데이터', fn: () => checkKisconFreshness() },
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

  const checkInId = Sentry.captureCheckIn(
    { monitorSlug: 'one-click-schema-check', status: 'in_progress' },
    {
      schedule: { type: 'crontab', value: '0 0 * * *' },
      checkinMargin: 5,
      maxRuntime: 2,
      timezone: 'Asia/Seoul',
    }
  )

  const results = await Promise.allSettled(HEALTH_TARGETS.map((t) => t.fn()))

  const failures: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      failures.push(`❌ ${HEALTH_TARGETS[i].name}: ${result.reason?.message ?? result.reason}`)
      Sentry.captureException(result.reason, {
        tags: { cron: 'schema-check', target: HEALTH_TARGETS[i].name },
      })
    }
  })

  if (failures.length > 0) {
    await sendSlackAlert(failures)
    Sentry.captureCheckIn({ checkInId, monitorSlug: 'one-click-schema-check', status: 'error' })
    return NextResponse.json({ ok: false, failures }, { status: 500 })
  }

  Sentry.captureCheckIn({ checkInId, monitorSlug: 'one-click-schema-check', status: 'ok' })
  return NextResponse.json({
    ok: true,
    checked: HEALTH_TARGETS.map((t) => t.name),
  })
}
