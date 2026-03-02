/**
 * KISCON 페이지네이션 구조 확인용 디버그 스크립트
 * self-hosted runner에서 실행하여 HTML 구조 파악
 */

async function fetchHtml(url: string, body: Record<string, string>): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

async function main() {
  // 하도급참여제한 — 페이지 1, 2, 3 각각 크롤링하여 tr 갯수 확인
  const SUBCON_URL = 'https://kiscon.net/cis/coad_subcon_limit_list.asp'
  const ARREARS_URL = 'https://kiscon.net/cis/coad_arrearsnotice.asp'

  for (const page of [1, 2, 3, 4]) {
    console.log(`\n=== 하도급참여제한 page ${page} ===`)
    const html = await fetchHtml(SUBCON_URL, { GotoPage: String(page) })

    // tbody tr 갯수
    const trMatches = html.match(/<tbody[\s\S]*?<\/tbody>/i)
    if (trMatches) {
      const rowCount = (trMatches[0].match(/<tr/gi) || []).length
      console.log(`tbody tr count: ${rowCount}`)
    }

    // 페이지네이션 영역 찾기 — GotoPage 관련 링크/버튼
    const paginationMatches = html.match(/GotoPage[^"')]*["')]/gi)
    if (paginationMatches) {
      console.log('GotoPage references:', [...new Set(paginationMatches)].join(', '))
    }

    // 총 건수 패턴 — "총 57건" 같은 패턴
    const totalMatch = html.match(/총\s*(\d+)\s*건/i)
    if (totalMatch) {
      console.log(`총 건수: ${totalMatch[1]}`)
    }

    // "전체 XX건" 패턴
    const totalMatch2 = html.match(/전체\s*(\d+)\s*건/i)
    if (totalMatch2) {
      console.log(`전체 건수: ${totalMatch2[1]}`)
    }

    // TotalCnt 패턴
    const totalCntMatch = html.match(/TotalCnt[=:]\s*["']?(\d+)/i)
    if (totalCntMatch) {
      console.log(`TotalCnt: ${totalCntMatch[1]}`)
    }

    // page_navi 또는 pagination 관련 div/span
    const navMatch = html.match(
      /<(?:div|span|td)[^>]*class="[^"]*(?:pag|navi|page)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|td)>/i
    )
    if (navMatch) {
      console.log('Page nav HTML:', navMatch[0].slice(0, 500))
    }

    // JavaScript goPage/GotoPage 함수 호출 패턴
    const goPageCalls = html.match(/(?:goPage|GotoPage)\s*\(\s*['"]?(\d+)/gi)
    if (goPageCalls) {
      console.log('goPage calls:', [...new Set(goPageCalls)].join(', '))
    }

    // form hidden fields
    const hiddenFields = html.match(/<input[^>]*type="hidden"[^>]*>/gi)
    if (hiddenFields) {
      console.log('Hidden fields:', hiddenFields.join('\n'))
    }

    if (page === 1) {
      // 상습체불도 1페이지만 확인
      console.log(`\n=== 상습체불 page 1 ===`)
      const arrearsHtml = await fetchHtml(ARREARS_URL, { GotoPage: '1' })
      const arrTrMatches = arrearsHtml.match(/<tbody[\s\S]*?<\/tbody>/i)
      if (arrTrMatches) {
        const rowCount = (arrTrMatches[0].match(/<tr/gi) || []).length
        console.log(`tbody tr count: ${rowCount}`)
      }
      const arrTotalMatch = arrearsHtml.match(/총\s*(\d+)\s*건/i)
      if (arrTotalMatch) console.log(`총 건수: ${arrTotalMatch[1]}`)
      const arrGoPage = arrearsHtml.match(/(?:goPage|GotoPage)\s*\(\s*['"]?(\d+)/gi)
      if (arrGoPage) console.log('goPage calls:', [...new Set(arrGoPage)].join(', '))
    }
  }
}

main().catch(console.error)
