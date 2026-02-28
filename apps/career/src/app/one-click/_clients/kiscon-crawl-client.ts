import 'server-only'

import * as cheerio from 'cheerio'

/**
 * KISCON(키스콘) 크롤링 클라이언트
 * - 상습체불건설사업자명단: https://kiscon.net/cis/coad_arrearsnotice.asp
 * - 하도급참여제한대상자: https://kiscon.net/cis/coad_subcon_limit_list.asp
 */

// ─── 상습체불 ─────────────────────────────────

export interface KisconArrearsItem {
  companyName: string // 법인/명칭
  address: string // 주소
  representative: string // 대표자
  penaltyHistory: string // 처분이력
  arrearsAmount: string // 체불금액(천원)
  publicationPeriod: string // 공표기간
}

const KISCON_ARREARS_URL = 'https://kiscon.net/cis/coad_arrearsnotice.asp'

/**
 * KISCON 상습체불건설사업자 명단 조회
 * 전체 건수가 적으므로(~12건) 전체 조회 후 회사명 매칭
 *
 * @param companyName 매칭할 회사명
 * @returns 매칭 결과 (없으면 빈 배열)
 */
export async function fetchKisconArrears(companyName: string): Promise<KisconArrearsItem[]> {
  const response = await fetch(KISCON_ARREARS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ GotoPage: '1' }).toString(),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`KISCON arrears page error: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)
  const items: KisconArrearsItem[] = []

  // 테이블 행 파싱
  $('table tbody tr').each((_i, row) => {
    const cells = $(row).find('td')
    if (cells.length < 6) return

    items.push({
      companyName: $(cells[1]).text().trim(),
      address: $(cells[1]).find('br').length ? $(cells[1]).contents().last().text().trim() : '',
      representative: $(cells[2]).text().trim(),
      penaltyHistory: $(cells[3]).text().trim(),
      arrearsAmount: $(cells[4]).text().trim(),
      publicationPeriod: $(cells[5]).text().trim(),
    })
  })

  // 회사명 포함 매칭 (정확 매칭이 어려우므로 부분 매칭)
  const normalized = companyName.replace(/\s/g, '')
  return items.filter((item) => {
    const itemName = item.companyName.replace(/\s/g, '')
    return itemName.includes(normalized) || normalized.includes(itemName)
  })
}

// ─── 하도급참여제한 ──────────────────────────────

export interface KisconSubconLimitItem {
  violationType: string // 위반법령코드
  companyName: string // 상호명
  corpNo: string // 법인번호
  bizRegNo: string // 사업자번호
  representative: string // 대표자
  restrictionStart: string // 제한시작일
  restrictionEnd: string // 제한종료일
  category: string // 분류
  announcementDate: string // 공시일
}

const KISCON_SUBCON_URL = 'https://kiscon.net/cis/coad_subcon_limit_list.asp'

/**
 * KISCON 하도급참여제한대상자 조회 (사업자번호 직접 검색)
 *
 * @param registrationNumber 사업자등록번호 (10자리, 하이픈 없음)
 * @returns 매칭 결과 (없으면 빈 배열)
 */
export async function fetchKisconSubconLimit(
  registrationNumber: string
): Promise<KisconSubconLimitItem[]> {
  const response = await fetch(KISCON_SUBCON_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      GotoPage: '1',
      // 사업자번호로 검색
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
  const $ = cheerio.load(html)
  const items: KisconSubconLimitItem[] = []

  $('table tbody tr').each((_i, row) => {
    const cells = $(row).find('td')
    if (cells.length < 9) return

    items.push({
      violationType: $(cells[1]).text().trim(),
      companyName: $(cells[2]).text().trim(),
      corpNo: $(cells[3]).text().trim(),
      bizRegNo: $(cells[4]).text().trim(),
      representative: $(cells[5]).text().trim(),
      restrictionStart: $(cells[6]).text().trim(),
      restrictionEnd: $(cells[7]).text().trim(),
      category: $(cells[8]).text().trim(),
      announcementDate: $(cells[9]).text().trim(),
    })
  })

  return items
}
