import 'server-only'

import * as cheerio from 'cheerio'

/**
 * 고용노동부 체불사업주 명단공개 크롤링
 * https://moel.go.kr/info/defaulter/defaulterList.do
 */

export interface MoelDefaulterItem {
  period: string // 회차
  name: string // 성명
  age: string // 나이
  companyName: string // 사업장명
  industry: string // 업종
  personalAddress: string // 주소지(사업주)
  companyAddress: string // 소재지(사업장)
  arrearsAmount: string // 체불액(원)
}

const MOEL_DEFAULTER_URL = 'https://moel.go.kr/info/defaulter/defaulterList.do'

/**
 * 고용노동부 체불사업주 명단 검색 (사업장명 기준)
 *
 * @param companyName 검색할 사업장명
 * @returns 매칭 결과 (없으면 빈 배열)
 */
export async function fetchMoelDefaulters(companyName: string): Promise<MoelDefaulterItem[]> {
  const response = await fetch(MOEL_DEFAULTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      pageIndex: '1',
      pageUnit: '100',
      schCol: 'compNm',
      schTxt: companyName,
    }).toString(),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`MOEL defaulter page error: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)
  const items: MoelDefaulterItem[] = []

  // 헤더 검증 — 사이트 구조 변경 감지
  const headers = $('table thead th')
    .map((_i, th) => $(th).text().trim())
    .get()
  const expectedHeaders = ['구분', '성명', '나이', '사업장명', '업종']
  if (!expectedHeaders.every((h) => headers.some((actual) => actual.includes(h)))) {
    throw new Error(`MOEL defaulter table schema changed: ${headers.join(', ')}`)
  }

  $('table tbody tr').each((_i, row) => {
    const cells = $(row).find('td')
    if (cells.length < 8) return

    items.push({
      period: $(cells[0]).text().trim(),
      name: $(cells[1]).text().trim(),
      age: $(cells[2]).text().trim(),
      companyName: $(cells[3]).text().trim(),
      industry: $(cells[4]).text().trim(),
      personalAddress: $(cells[5]).text().trim(),
      companyAddress: $(cells[6]).text().trim(),
      arrearsAmount: $(cells[7]).text().trim(),
    })
  })

  return items
}
