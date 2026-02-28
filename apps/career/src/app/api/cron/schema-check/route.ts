import { NextResponse } from 'next/server'
import { fetchMoelDefaulters } from '@/app/one-click/_clients/moel-client'
import {
  fetchKisconArrears,
  fetchKisconSubconLimit,
} from '@/app/one-click/_clients/kiscon-crawl-client'

const CRAWL_TARGETS = [
  { name: 'MOEL 체불사업주', fn: () => fetchMoelDefaulters('__schema_check__') },
  { name: 'KISCON 상습체불', fn: () => fetchKisconArrears('__schema_check__') },
  { name: 'KISCON 하도급제한', fn: () => fetchKisconSubconLimit('0000000000') },
]

async function sendSlackAlert(failures: string[]) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 *크롤링 스키마 변경 감지*\n\n${failures.join('\n')}`,
    }),
  })
}

export async function GET(request: Request) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await Promise.allSettled(CRAWL_TARGETS.map((t) => t.fn()))

  const failures: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      failures.push(`❌ ${CRAWL_TARGETS[i].name}: ${result.reason?.message ?? result.reason}`)
    }
  })

  if (failures.length > 0) {
    await sendSlackAlert(failures)
    return NextResponse.json({ ok: false, failures }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    checked: CRAWL_TARGETS.map((t) => t.name),
  })
}
