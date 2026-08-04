// 원격 수집: 요청·재시도·페이지 순회

const FETCH_TIMEOUT_MS = 30_000
const RETRY_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 1_000
const PAGE_DELAY_MS = 150
const MAX_PAGES = 4_000

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export interface FetchOptions {
  method?: 'GET' | 'POST'
  query?: Record<string, string | number>
  form?: Record<string, string | number>
  headers?: Record<string, string>
  timeoutMs?: number
}

async function request(url: string, options: FetchOptions = {}): Promise<Response> {
  const target = new URL(url)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    target.searchParams.set(key, String(value))
  }

  const headers = { ...options.headers }
  let body: string | undefined
  if (options.form) {
    body = new URLSearchParams(
      Object.entries(options.form).map(([key, value]): [string, string] => [key, String(value)])
    ).toString()
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  const response = await fetch(target.toString(), {
    method: options.method ?? (options.form ? 'POST' : 'GET'),
    headers,
    body,
    signal: AbortSignal.timeout(options.timeoutMs ?? FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText} from ${target.host}${target.pathname}`
    )
  }

  return response
}

export async function fetchHtml(url: string, options?: FetchOptions): Promise<string> {
  const response = await request(url, options)
  return response.text()
}

export async function fetchCsv(
  url: string,
  options: FetchOptions & { encoding?: 'utf-8' | 'euc-kr' } = {}
): Promise<string> {
  const response = await request(url, options)
  const buffer = await response.arrayBuffer()
  console.log(`[csv] 다운로드 완료: ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB`)
  return new TextDecoder(options.encoding ?? 'utf-8').decode(buffer)
}

export async function fetchJson<T>(url: string, options?: FetchOptions): Promise<T> {
  const response = await request(url, options)
  return (await response.json()) as T
}

// 지수 백오프 재시도
export async function withRetry<T>(task: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await task()
    } catch (e) {
      lastError = e as Error
      if (attempt === RETRY_ATTEMPTS) break
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.warn(
        `[retry] ${attempt}/${RETRY_ATTEMPTS} 실패, ${delay}ms 후 재시도: ${lastError.message}`
      )
      await sleep(delay)
    }
  }

  throw lastError!
}

export interface PageResult<T> {
  items: T[]
  totalCount?: number
}

// 페이지 순회. totalCount 가 오면 그 값 기준, 없으면 빈 페이지 또는 짧은 페이지에서 종료
export async function withPage<T>(
  label: string,
  fetchPage: (page: number) => Promise<PageResult<T>>
): Promise<T[]> {
  const all: T[] = []
  let pageSize = 0
  let totalPages: number | null = null

  for (let page = 1; page <= MAX_PAGES; page++) {
    if (page > 1) await sleep(PAGE_DELAY_MS)

    const { items, totalCount } = await fetchPage(page)
    if (items.length === 0) break

    if (page === 1) {
      pageSize = items.length
      if (totalCount != null && totalCount > 0) {
        totalPages = Math.ceil(totalCount / pageSize)
      }
    }

    all.push(...items)
    console.log(
      `[${label}] page ${page}${totalPages != null ? `/${totalPages}` : ''}: ${items.length}건 (누적 ${all.length})`
    )

    if (totalPages != null && page >= totalPages) break
    if (items.length < pageSize) break
  }

  return all
}
