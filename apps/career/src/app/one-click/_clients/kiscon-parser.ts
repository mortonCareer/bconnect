import * as cheerio from 'cheerio'

// ─── 상습체불 ─────────────────────────────────

export interface KisconArrearsItem {
  companyName: string // 법인/명칭
  address: string // 주소
  representative: string // 대표자
  penaltyHistory: string // 처분이력
  arrearsAmount: string // 체불금액(천원)
  publicationPeriod: string // 공표기간
}

/**
 * 상습체불 HTML → 구조화된 배열로 파싱
 * @throws 사이트 구조가 변경된 경우
 */
export function parseArrearsHtml(html: string): KisconArrearsItem[] {
  const $ = cheerio.load(html)
  const items: KisconArrearsItem[] = []

  const dataTable = $('table').filter((_i, el) => {
    const firstTh = $(el).find('th').first().text().trim()
    return firstTh === '연번'
  })

  // 헤더 검증 — 사이트 구조 변경 감지
  const headers = dataTable
    .find('th')
    .map((_i, th) => $(th).text().trim())
    .get()
  const expectedHeaders = ['연번', '명칭', '처분이력', '체불금액', '공표기간']
  if (!expectedHeaders.every((h) => headers.some((actual) => actual.includes(h)))) {
    throw new Error(`KISCON arrears table schema changed: ${headers.join(', ')}`)
  }

  dataTable.find('tbody tr').each((_i, row) => {
    const cells = $(row).find('td')
    if (cells.length < 10) return

    items.push({
      companyName: $(cells[1]).text().trim(),
      address: $(cells[2]).text().trim(),
      representative: $(cells[3]).text().trim(),
      penaltyHistory: $(cells[6]).text().trim(),
      arrearsAmount: $(cells[8]).text().trim(),
      publicationPeriod: $(cells[9]).text().trim(),
    })
  })

  return items
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

/**
 * 하도급참여제한 HTML → 구조화된 배열로 파싱
 * @throws 사이트 구조가 변경된 경우
 */
export function parseSubconLimitHtml(html: string): KisconSubconLimitItem[] {
  const $ = cheerio.load(html)
  const items: KisconSubconLimitItem[] = []

  const dataTable = $('table').filter((_i, el) => {
    const firstTh = $(el).find('th').first().text().trim()
    return firstTh === '연번'
  })

  // 헤더 검증 — 사이트 구조 변경 감지
  const headers = dataTable
    .find('th')
    .map((_i, th) => $(th).text().trim())
    .get()
  const expectedHeaders = ['연번', '위반법령', '상호', '법인번호', '사업자번호', '대표자']
  if (!expectedHeaders.every((h) => headers.some((actual) => actual.includes(h)))) {
    throw new Error(`KISCON subcon table schema changed: ${headers.join(', ')}`)
  }

  dataTable.find('tbody tr').each((_i, row) => {
    const cells = $(row).find('td')
    if (cells.length < 10) return

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
