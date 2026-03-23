/**
 * KISCON 데이터 동기화 스크립트
 *
 * kiscon.net에서 전체 목록을 크롤링 → 변경분만 S3에 JSON으로 저장
 * - 상습체불건설사업자명단 → kiscon/arrears.json
 * - 하도급참여제한대상자 → kiscon/subcon-limits.json
 *
 * items 배열의 SHA-256 해시를 비교하여 변경이 있을 때만 업로드.
 *
 * 실행: pnpm --filter morton-career exec tsx scripts/kiscon-sync.ts
 * 환경변수: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
 */

import { createHash } from 'node:crypto'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
  isArrearsActive,
  isSubconActive,
  parseArrearsHtml,
  parseSubconLimitHtml,
  parseTotalCount,
} from '../src/app/one-click/_clients/kiscon-parser'

const S3_BUCKET = process.env.AWS_S3_BUCKET ?? 'morton-storage'
const AWS_REGION = process.env.AWS_REGION ?? 'ap-northeast-2'

const KISCON_ARREARS_URL = 'https://kiscon.net/cis/coad_arrearsnotice.asp'
const KISCON_SUBCON_URL = 'https://kiscon.net/cis/coad_subcon_limit_list.asp'

const s3 = new S3Client({ region: AWS_REGION })

function itemsHash(items: unknown[]): string {
  return createHash('sha256').update(JSON.stringify(items)).digest('hex')
}

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

async function getExistingHash(key: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
    const response = await s3.send(command)
    const body = await response.Body!.transformToString()
    const data = JSON.parse(body) as { checksum?: string }
    return data.checksum ?? null
  } catch {
    return null // 파일 없음 → 최초 업로드
  }
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

/**
 * 전체 페이지를 순회하여 모든 아이템 수집
 * 1페이지 HTML에서 totalcnt를 읽고, pageSize로 총 페이지 수를 계산
 */
async function fetchAllPages<T>(
  url: string,
  baseBody: Record<string, string>,
  parseHtml: (html: string) => T[]
): Promise<T[]> {
  const firstHtml = await fetchHtml(url, { ...baseBody, GotoPage: '1' })
  const firstItems = parseHtml(firstHtml)
  const totalCount = parseTotalCount(firstHtml)

  if (totalCount === 0 || firstItems.length === 0) return firstItems

  const pageSize = firstItems.length
  const totalPages = Math.ceil(totalCount / pageSize)

  if (totalPages <= 1) return firstItems

  console.log(`[kiscon-sync]   총 ${totalCount}건, ${totalPages}페이지 (${pageSize}건/페이지)`)

  const allItems = [...firstItems]
  for (let page = 2; page <= totalPages; page++) {
    const html = await fetchHtml(url, { ...baseBody, GotoPage: String(page) })
    const items = parseHtml(html)
    allItems.push(...items)
    if (items.length < pageSize) break // 마지막 페이지
  }

  return allItems
}

async function main() {
  const now = new Date().toISOString()
  console.log(`[kiscon-sync] 시작: ${now}`)

  // 상습체불 크롤링 (전체 페이지 순회)
  console.log('[kiscon-sync] 상습체불 크롤링...')
  const arrearsAll = await fetchAllPages(KISCON_ARREARS_URL, {}, parseArrearsHtml)
  const arrearsItems = arrearsAll.filter(isArrearsActive)
  const arrearsChecksum = itemsHash(arrearsItems)
  console.log(
    `[kiscon-sync] 상습체불: ${arrearsAll.length}건 중 유효 ${arrearsItems.length}건 (만료 ${arrearsAll.length - arrearsItems.length}건 제외)`
  )

  const existingArrearsHash = await getExistingHash('kiscon/arrears.json')
  const arrearsChanged = existingArrearsHash !== arrearsChecksum
  await uploadToS3('kiscon/arrears.json', {
    lastUpdated: now,
    checksum: arrearsChecksum,
    items: arrearsItems,
  })
  console.log(
    `[kiscon-sync] kiscon/arrears.json 업로드 완료${arrearsChanged ? '' : ' (변경 없음, timestamp만 갱신)'}`
  )

  // 하도급참여제한 크롤링 (전체 페이지 순회)
  console.log('[kiscon-sync] 하도급참여제한 크롤링...')
  const subconAll = await fetchAllPages(KISCON_SUBCON_URL, {}, parseSubconLimitHtml)
  const subconItems = subconAll.filter(isSubconActive)
  const subconChecksum = itemsHash(subconItems)
  console.log(
    `[kiscon-sync] 하도급참여제한: ${subconAll.length}건 중 유효 ${subconItems.length}건 (만료 ${subconAll.length - subconItems.length}건 제외)`
  )

  const existingSubconHash = await getExistingHash('kiscon/subcon-limits.json')
  const subconChanged = existingSubconHash !== subconChecksum
  await uploadToS3('kiscon/subcon-limits.json', {
    lastUpdated: now,
    checksum: subconChecksum,
    items: subconItems,
  })
  console.log(
    `[kiscon-sync] kiscon/subcon-limits.json 업로드 완료${subconChanged ? '' : ' (변경 없음, timestamp만 갱신)'}`
  )

  console.log(
    `[kiscon-sync] 완료 — 상습체불 ${arrearsItems.length}건, 하도급제한 ${subconItems.length}건`
  )
}

main().catch((err) => {
  console.error('[kiscon-sync] 실패:', err)
  process.exit(1)
})
