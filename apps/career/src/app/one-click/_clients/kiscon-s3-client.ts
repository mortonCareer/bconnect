import 'server-only'

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
  type KisconArrearsItem,
  type KisconSubconLimitItem,
  isArrearsActive,
  isSubconActive,
} from './kiscon-parser'

export type { KisconArrearsItem, KisconSubconLimitItem }

const S3_BUCKET = process.env.AWS_S3_BUCKET ?? 'morton-storage'
const ARREARS_KEY = 'kiscon/arrears.json'
const SUBCON_LIMITS_KEY = 'kiscon/subcon-limits.json'

// 14일 이내 데이터만 유효
const FRESHNESS_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000

interface KisconS3Data<T> {
  lastUpdated: string
  items: T[]
}

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-northeast-2' })

async function getS3Json<T>(key: string): Promise<KisconS3Data<T>> {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
  const response = await s3.send(command)
  const body = await response.Body!.transformToString()
  return JSON.parse(body) as KisconS3Data<T>
}

// ─── S3 데이터 freshness 체크 ────────────────────

export async function checkKisconFreshness(): Promise<void> {
  const [arrears, subcon] = await Promise.all([
    getS3Json<KisconArrearsItem>(ARREARS_KEY),
    getS3Json<KisconSubconLimitItem>(SUBCON_LIMITS_KEY),
  ])

  const now = Date.now()
  const stale: string[] = []

  if (now - new Date(arrears.lastUpdated).getTime() > FRESHNESS_THRESHOLD_MS) {
    stale.push(`KISCON 상습체불 (last: ${arrears.lastUpdated})`)
  }
  if (now - new Date(subcon.lastUpdated).getTime() > FRESHNESS_THRESHOLD_MS) {
    stale.push(`KISCON 하도급제한 (last: ${subcon.lastUpdated})`)
  }

  if (stale.length > 0) {
    throw new Error(`KISCON S3 데이터 만료: ${stale.join(', ')}`)
  }
}

// ─── 조회 함수 ──────────────────────────────────

/**
 * S3에서 상습체불 데이터 조회 + 회사명 매칭 + 공표기간 필터
 */
export async function fetchKisconArrearsFromS3(companyName: string): Promise<KisconArrearsItem[]> {
  const data = await getS3Json<KisconArrearsItem>(ARREARS_KEY)
  const active = data.items.filter(isArrearsActive)

  const normalized = companyName.replace(/\s/g, '')
  return active.filter((item) => {
    const itemName = item.companyName.replace(/\s/g, '')
    return itemName.includes(normalized) || normalized.includes(itemName)
  })
}

/**
 * S3에서 하도급참여제한 데이터 조회 + 사업자번호 매칭 + 제한기간 필터
 */
export async function fetchKisconSubconFromS3(
  registrationNumber: string
): Promise<KisconSubconLimitItem[]> {
  const data = await getS3Json<KisconSubconLimitItem>(SUBCON_LIMITS_KEY)
  const active = data.items.filter(isSubconActive)

  return active.filter((item) => {
    const itemBizNo = item.bizRegNo.replace(/[-\s]/g, '')
    return itemBizNo === registrationNumber
  })
}
