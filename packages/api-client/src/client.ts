import ky, { HTTPError } from 'ky'

const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:8080'
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
}

// Access Token 인메모리 저장
let accessToken: string | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

export const getAccessToken = () => accessToken

// API 응답 타입 (Type Narrowing용)
type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  error: {
    code: string
    message: string
  }
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 토큰 갱신 함수
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await ky.post(`${getBaseUrl()}/api/v1/auth/refresh`, {
      credentials: 'include',
    })
    const json = (await response.json()) as ApiResponse<{ accessToken: string }>

    if (json.success) {
      setAccessToken(json.data.accessToken)
      return true
    }
    return false
  } catch {
    return false
  }
}

export const apiClient = ky.create({
  prefixUrl: getBaseUrl(),
  timeout: 30000,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (request) => {
        if (accessToken) {
          request.headers.set('Authorization', `Bearer ${accessToken}`)
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (
          (response.status === 401 || response.status === 403) &&
          !request.headers.get('X-Retry')
        ) {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            request.headers.set('Authorization', `Bearer ${accessToken}`)
            request.headers.set('X-Retry', '1')
            return ky(request, options)
          }
        }
        return response
      },
    ],
  },
})

// Orval mutator 시그니처
type RequestConfig = {
  url: string
  method: string
  headers?: Record<string, string>
  data?: unknown
  params?: Record<string, unknown>
  signal?: AbortSignal
}

// 채팅 mock: Route Handler로 처리되는 경로 — 같은 origin으로 요청
// TODO: BE 채팅 API 완성 시 이 배열과 아래 분기 로직 삭제
const MOCK_PATHS = ['api/v1/chats']
const isMockPath = (url: string) => MOCK_PATHS.some((p) => url.startsWith(p))

export async function customFetch<T>(config: RequestConfig, _options?: RequestInit): Promise<T> {
  // ky prefixUrl은 슬래시로 시작하는 경로를 허용하지 않음
  const normalizedUrl = config.url.startsWith('/') ? config.url.slice(1) : config.url

  // 채팅 mock 경로는 같은 origin(Next.js Route Handler)으로 요청
  const client =
    isMockPath(normalizedUrl) && typeof window !== 'undefined'
      ? ky.create({ prefixUrl: window.location.origin, timeout: 30000, credentials: 'include' })
      : apiClient

  try {
    const response = await client(normalizedUrl, {
      method: config.method,
      json: config.data,
      headers: config.headers,
      searchParams: config.params as Record<string, string | number | boolean> | undefined,
      signal: config.signal,
    })

    const json = (await response.json()) as ApiResponse<T>

    if (!json.success) {
      throw new ApiError(json.error.code, json.error.message)
    }

    // ApiResponse 래퍼를 벗기고 실제 데이터만 반환
    return json.data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof HTTPError) {
      const json = (await error.response.json()) as ApiErrorResponse
      throw new ApiError(json.error.code, json.error.message)
    }
    throw error
  }
}
