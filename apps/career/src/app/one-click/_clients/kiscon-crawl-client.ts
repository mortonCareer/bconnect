import 'server-only'

import {
  type KisconArrearsItem,
  type KisconSubconLimitItem,
  parseArrearsHtml,
  parseSubconLimitHtml,
} from './kiscon-parser'

export type { KisconArrearsItem, KisconSubconLimitItem }

/**
 * KISCON(키스콘) 크롤링 클라이언트
 * - 상습체불건설사업자명단: https://kiscon.net/cis/coad_arrearsnotice.asp
 * - 하도급참여제한대상자: https://kiscon.net/cis/coad_subcon_limit_list.asp
 *
 * ⚠️ kiscon.net은 클라우드 IP(AWS/Vercel) 차단 — 프로덕션에서는 S3 캐시 사용 권장
 */

// kiscon.net은 User-Agent 없는 요청에 HTTP 410을 반환함 (Vercel 서버리스 환경 대응)
const KISCON_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'Mozilla/5.0 (compatible; MortonBot/1.0)',
}

const KISCON_ARREARS_URL = 'https://kiscon.net/cis/coad_arrearsnotice.asp'
const KISCON_SUBCON_URL = 'https://kiscon.net/cis/coad_subcon_limit_list.asp'

/**
 * KISCON 상습체불건설사업자 명단 조회
 * 전체 건수가 적으므로(~12건) 전체 조회 후 회사명 매칭
 *
 * @test positive '삼아종합건설' (regNo 1238141583) → 1건 이상 (2026-02-28)
 * @test negative '이엔씨부강' (regNo 6138127726) → 빈 배열 (2026-02-28)
 */
export async function fetchKisconArrears(companyName: string): Promise<KisconArrearsItem[]> {
  const response = await fetch(KISCON_ARREARS_URL, {
    method: 'POST',
    headers: KISCON_HEADERS,
    body: new URLSearchParams({ GotoPage: '1' }).toString(),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`KISCON arrears page error: ${response.status}`)
  }

  const html = await response.text()
  const items = parseArrearsHtml(html)

  // 회사명 포함 매칭 (정확 매칭이 어려우므로 부분 매칭)
  const normalized = companyName.replace(/\s/g, '')
  return items.filter((item) => {
    const itemName = item.companyName.replace(/\s/g, '')
    return itemName.includes(normalized) || normalized.includes(itemName)
  })
}

/**
 * KISCON 하도급참여제한대상자 조회 (사업자번호 직접 검색)
 *
 * @test positive 6138127726 → (주)이엔씨부강, 1건 이상 (2026-02-28)
 * @test negative 6948102758 → 빈 배열 (2026-02-28)
 */
export async function fetchKisconSubconLimit(
  registrationNumber: string
): Promise<KisconSubconLimitItem[]> {
  const response = await fetch(KISCON_SUBCON_URL, {
    method: 'POST',
    headers: KISCON_HEADERS,
    body: new URLSearchParams({
      GotoPage: '1',
      searchGubun: 'bizRegNo',
      searchText: registrationNumber,
    }).toString(),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`KISCON subcon limit page error: ${response.status}`)
  }

  const html = await response.text()
  const items = parseSubconLimitHtml(html)

  // 사업자번호 매칭 (사이트가 검색 실패 시 전체 목록을 반환하므로 필터링 필수)
  return items.filter((item) => {
    const itemBizNo = item.bizRegNo.replace(/[-\s]/g, '')
    return itemBizNo === registrationNumber
  })
}
