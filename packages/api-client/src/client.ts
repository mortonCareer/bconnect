// ky: fetch wrapper — 우리는 prefixUrl/timeout/credentials 같은 cross-cutting 옵션과
// hook (beforeRequest, afterResponse) 시스템 때문에 native fetch 대신 사용.
// orval 의 mutator (customFetch) 는 ky 인스턴스 (apiClient) 를 호출해 access token 주입과
// 401 → refresh → retry 자동 처리. 다른 후보 (axios, ofetch) 대비 ky 가 가장 가볍고
// hook API 가 명확함.
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

// API 응답 envelope. spec 의 ApiSuccessResponseBase + paths 의 allOf 패턴과 정렬됨.
// orval 이 생성하는 endpoint 응답 타입은 `ApiSuccessResponseBase & { data: T }` 형태 —
// 여기 generic 의 T 가 그 inner data 를 채움.
//
// Generic 으로 두는 이유: 사용처에서 `ApiSuccessResponse<{ accessToken: string }>` 처럼
// 호출 별 data 타입을 inline 지정 가능. default 가 never 라 의도치 않은 unknown 노출 방지.
type ApiSuccessResponse<T = never> = {
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

// Generic envelope 의 data 필드 타입을 추출. customFetch<TResponse> 는 inner 데이터를 반환.
// void 응답은 envelope 에 data 필드가 없어 T 자체로 fallback (콜러는 .data 를 읽지 않음).
type ExtractData<T> = T extends { data: infer D } ? D : T

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
    const json = (await response.json()) as
      | ApiSuccessResponse<{ accessToken: string }>
      | ApiErrorResponse

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

// orval 이 생성하는 호출 형태: `customFetch<SendOtp200>(...)` — T 는 envelope 타입.
// 반환은 envelope 의 inner data (T['data']) — 호출부 hook 의 data 가 raw payload 와 정렬됨.
export async function customFetch<T>(
  config: RequestConfig,
  _options?: RequestInit
): Promise<ExtractData<T>> {
  // ky prefixUrl은 슬래시로 시작하는 경로를 허용하지 않음
  const normalizedUrl = config.url.startsWith('/') ? config.url.slice(1) : config.url

  try {
    const response = await apiClient(normalizedUrl, {
      method: config.method,
      json: config.data,
      headers: config.headers,
      searchParams: config.params as Record<string, string | number | boolean> | undefined,
      signal: config.signal,
    })

    const json = (await response.json()) as ApiSuccessResponse<ExtractData<T>> | ApiErrorResponse

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
