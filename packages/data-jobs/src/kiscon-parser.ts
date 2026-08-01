import * as cheerio from 'cheerio'

// totalcnt hidden field 값 추출 (`<input name="totalcnt" value="57">`)
export function parseTotalCount(html: string): number {
  const $ = cheerio.load(html)
  const totalcnt = $('input[name="totalcnt"]').val()
  return totalcnt ? Number(totalcnt) : 0
}

export interface KisconArrearsItem {
  seqNo: string // 연번
  companyName: string // 법인 명칭
  address: string // 법인 주소
  representative: string // 대표자 성명
  representativeAge: string // 대표자 나이
  representativeAddress: string // 대표자 주소
  penaltyHistory: string // 처분이력
  penaltyDates: string // 처분일자
  arrearsAmount: string // 체불금액(천원)
  publicationPeriod: string // 공표기간
}

// 상습체불 HTML 파싱 (구조 변경 시 throw)
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
      seqNo: $(cells[0]).text().trim(),
      companyName: $(cells[1]).text().trim(),
      address: $(cells[2]).text().trim(),
      representative: $(cells[3]).text().trim(),
      representativeAge: $(cells[4]).text().trim(),
      representativeAddress: $(cells[5]).text().trim(),
      penaltyHistory: $(cells[6]).text().trim(),
      penaltyDates: $(cells[7]).text().trim(),
      arrearsAmount: $(cells[8]).text().trim(),
      publicationPeriod: $(cells[9]).text().trim(),
    })
  })

  return items
}

// 공표기간 만료 판정 ("2024.01~2026.01") — 종료 데이터는 명예훼손 리스크로 제외
export function isArrearsActive(item: KisconArrearsItem): boolean {
  const match = item.publicationPeriod.match(/~\s*(\d{4})\.(\d{2})/)
  if (!match) return true // 파싱 실패 시 보수적으로 포함
  const endDate = new Date(Number(match[1]), Number(match[2]) - 1 + 1) // 종료월 다음달 1일
  return endDate > new Date()
}

export interface KisconSubconLimitItem {
  seqNo: string // 연번
  violationType: string // 위반법령
  companyName: string // 상호
  corpNo: string // 법인번호
  bizRegNo: string // 사업자번호
  representative: string // 대표자
  restrictionStart: string // 하도급참여제한 시작일
  restrictionEnd: string // 하도급참여제한 종료일
  category: string // 구분
  announcementDate: string // 게재일
  certificateUrl: string // 참여제한 확인서 다운로드
  note: string // 비고
}

// 하도급참여제한 HTML 파싱 (구조 변경 시 throw)
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
      seqNo: $(cells[0]).text().trim(),
      violationType: $(cells[1]).text().trim(),
      companyName: $(cells[2]).text().trim(),
      corpNo: $(cells[3]).text().trim(),
      bizRegNo: $(cells[4]).text().trim(),
      representative: $(cells[5]).text().trim(),
      restrictionStart: $(cells[6]).text().trim(),
      restrictionEnd: $(cells[7]).text().trim(),
      category: $(cells[8]).text().trim(),
      announcementDate: $(cells[9]).text().trim(),
      certificateUrl: $(cells[10]).find('a').attr('href')?.trim() ?? '',
      note: $(cells[11]).text().trim(),
    })
  })

  return items
}

// 제한종료일 만료 판정 ("2025.03.01") — 종료 데이터 제외
export function isSubconActive(item: KisconSubconLimitItem): boolean {
  const parts = item.restrictionEnd.match(/(\d{4})\.(\d{2})\.(\d{2})/)
  if (!parts) return true
  const endDate = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
  return endDate > new Date()
}
