import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = 'https://kiscon.net/cis/coad_subcon_limit_list.asp'
  const results: Record<string, unknown> = {}

  try {
    const start = Date.now()
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; MortonBot/1.0)',
      },
      body: new URLSearchParams({
        GotoPage: '1',
        searchGubun: 'bizRegNo',
        searchText: '1248100998',
      }).toString(),
      cache: 'no-store',
      signal: AbortSignal.timeout(55_000),
    })

    results.status = response.status
    results.statusText = response.statusText
    results.time = Date.now() - start
    results.headers = Object.fromEntries(response.headers.entries())

    const text = await response.text()
    results.bodyLength = text.length
    results.hasTable = text.includes('연번')
    results.bodySnippet = text.slice(0, 500)
  } catch (e) {
    results.error = e instanceof Error ? e.message : String(e)
    results.errorName = e instanceof Error ? e.name : 'unknown'
  }

  return NextResponse.json(results)
}
