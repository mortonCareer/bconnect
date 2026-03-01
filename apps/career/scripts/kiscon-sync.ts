/**
 * KISCON 데이터 동기화 스크립트
 *
 * kiscon.net에서 전체 목록을 크롤링 → S3에 JSON으로 저장
 * - 상습체불건설사업자명단 → kiscon/arrears.json
 * - 하도급참여제한대상자 → kiscon/subcon-limits.json
 *
 * 실행: pnpm --filter morton-career exec tsx scripts/kiscon-sync.ts
 * 환경변수: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
 */

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { parseArrearsHtml, parseSubconLimitHtml } from '../src/app/one-click/_clients/kiscon-parser'

const S3_BUCKET = process.env.AWS_S3_BUCKET ?? 'morton-storage'
const AWS_REGION = process.env.AWS_REGION ?? 'ap-northeast-2'

const KISCON_ARREARS_URL = 'https://kiscon.net/cis/coad_arrearsnotice.asp'
const KISCON_SUBCON_URL = 'https://kiscon.net/cis/coad_subcon_limit_list.asp'

const s3 = new S3Client({ region: AWS_REGION })

async function fetchHtml(url: string, body: Record<string, string>): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`)
  }

  return response.text()
}

async function uploadToS3(key: string, data: unknown): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  })
  await s3.send(command)
}

async function main() {
  const now = new Date().toISOString()
  console.log(`[kiscon-sync] 시작: ${now}`)

  // 상습체불 크롤링
  console.log('[kiscon-sync] 상습체불 크롤링...')
  const arrearsHtml = await fetchHtml(KISCON_ARREARS_URL, { GotoPage: '1' })
  const arrearsItems = parseArrearsHtml(arrearsHtml)
  console.log(`[kiscon-sync] 상습체불: ${arrearsItems.length}건`)

  await uploadToS3('kiscon/arrears.json', {
    lastUpdated: now,
    items: arrearsItems,
  })
  console.log('[kiscon-sync] kiscon/arrears.json 업로드 완료')

  // 하도급참여제한 크롤링
  console.log('[kiscon-sync] 하도급참여제한 크롤링...')
  const subconHtml = await fetchHtml(KISCON_SUBCON_URL, { GotoPage: '1' })
  const subconItems = parseSubconLimitHtml(subconHtml)
  console.log(`[kiscon-sync] 하도급참여제한: ${subconItems.length}건`)

  await uploadToS3('kiscon/subcon-limits.json', {
    lastUpdated: now,
    items: subconItems,
  })
  console.log('[kiscon-sync] kiscon/subcon-limits.json 업로드 완료')

  console.log(
    `[kiscon-sync] 완료 — 상습체불 ${arrearsItems.length}건, 하도급제한 ${subconItems.length}건`
  )
}

main().catch((err) => {
  console.error('[kiscon-sync] 실패:', err)
  process.exit(1)
})
