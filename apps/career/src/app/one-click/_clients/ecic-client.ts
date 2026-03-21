import 'server-only'

import * as cheerio from 'cheerio'

/**
 * ECIC 전기공사종합정보시스템 업체조회 스크래핑
 * https://www.keca.or.kr/ecic/ad/ad0101.do
 */

export interface EcicCompanyItem {
  registrationNo: string // 전기공사업 등록번호 (서울-05583)
  companyName: string // 상호
  representative: string // 대표자
  address: string // 소재지
}

const ECIC_URL = 'https://www.keca.or.kr/ecic/ad/ad0101.do'

function formatBizRegNo(bNo: string): string {
  if (bNo.length !== 10) return bNo
  return `${bNo.slice(0, 3)}-${bNo.slice(3, 5)}-${bNo.slice(5)}`
}

/**
 * ECIC 전기공사업 면허 검색 (사업자등록번호 기준)
 *
 * @param bizRegNo 사업자등록번호 (10자리, 하이픈 없음)
 * @returns 매칭 결과 (없으면 빈 배열)
 */
export async function fetchEcicCompanies(bizRegNo: string): Promise<EcicCompanyItem[]> {
  const formatted = formatBizRegNo(bizRegNo)

  const url = new URL(ECIC_URL)
  url.searchParams.set('menuCd', '6047')
  url.searchParams.set('searchGubun', 'saupNo')
  url.searchParams.set('searchText', formatted)

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`ECIC page error: ${response.status}`)
  }

  const html = await response.text()
  return parseEcicSearchResult(html)
}

function parseEcicSearchResult(html: string): EcicCompanyItem[] {
  const $ = cheerio.load(html)
  const items: EcicCompanyItem[] = []

  // 헤더 검증 — 사이트 구조 변경 감지
  const headers = $('table thead th')
    .map((_i, th) => $(th).text().trim())
    .get()
  if (!headers.some((h) => h.includes('등록번호'))) {
    throw new Error(`ECIC table schema changed: ${headers.join(', ')}`)
  }

  $('table tbody tr').each((_i, row) => {
    const cells = $(row).find('td')
    if (cells.length < 4) return

    const registrationNo = $(cells[0]).text().trim()
    const companyName = $(cells[1]).text().trim()
    const representative = $(cells[2]).text().trim()
    const address = $(cells[3]).text().trim()

    // 빈 행이나 "데이터가 없습니다" 같은 안내 행 스킵
    if (!registrationNo || !companyName) return

    items.push({ registrationNo, companyName, representative, address })
  })

  return items
}
