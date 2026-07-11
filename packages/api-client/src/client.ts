// ky: fetch wrapper — 우리는 prefixUrl/timeout/credentials 같은 cross-cutting 옵션과
// hook (beforeRequest, afterResponse) 시스템 때문에 native fetch 대신 사용.
// orval 의 mutator (customFetch) 는 ky 인스턴스 (apiClient) 를 호출해 access token 주입과
// 401 → refresh → retry 자동 처리. 다른 후보 (axios, ofetch) 대비 ky 가 가장 가볍고
// hook API 가 명확함.
import ky, { HTTPError } from 'ky'

import { setAuthHint, clearAuthHint } from './auth-hint'

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

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 토큰 갱신 함수 — single-flight (#782). BE 가 refresh 토큰을 회전(rotate)하고
// mismatch 시 세션을 revoke 하므로, 동시 401 들이 각자 refresh 를 쏘면 뒤의 요청이
// 폐기된 토큰으로 세션을 죽인다. 진행 중이면 같은 promise 를 공유해 refresh 를 1회로 묶는다.
let refreshPromise: Promise<boolean> | null = null

export function refreshAccessToken(): Promise<boolean> {
  refreshPromise ??= doRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function doRefresh(): Promise<boolean> {
  try {
    const response = await ky.post(`${getBaseUrl()}/api/v1/auth/refresh`, {
      credentials: 'include',
    })
    const json = (await response.json()) as
      | ApiSuccessResponse<{ accessToken: string }>
      | ApiErrorResponse

    if (json.success) {
      setAccessToken(json.data.accessToken)
      setAuthHint()
      return true
    }
    clearAuthHint()
    return false
  } catch (error) {
    // HTTPError = BE 가 refresh 를 거절 (세션 만료/무효) → 표시 쿠키 제거.
    // 그 외 (네트워크 단절 등) 는 세션 판단 불가라 유지.
    if (error instanceof HTTPError) {
      clearAuthHint()
    }
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
        // 401 만 refresh 트리거 — 403 은 인가 실패(또는 BE 에러 dispatch 마스킹, #763)라
        // refresh 로 해소되지 않는다 (#782).
        if (response.status === 401 && !request.headers.get('X-Retry')) {
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

/**
 * 런타임에서 ApiResponse envelope (`{ success, data }`) 을 벗기고 inner data 만
 * return + 401/403 retry + 4xx → ApiError throw. spec 단계의 type 정렬은
 * `orval.transformer.ts` 가 담당.
 */
export async function customFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  // ky prefixUrl 은 leading slash 거부 — orval URL 이 `/api/...` 로 시작하므로 strip
  const normalizedUrl = url.startsWith('/') ? url.slice(1) : url

  try {
    const response = await apiClient(normalizedUrl, options)

    // 204 No Content 등 빈 응답은 envelope 없이 통과 (T = void 케이스)
    const text = await response.text()
    if (!text) return undefined as T

    const json = JSON.parse(text) as unknown
    // BE 는 envelope (`{success, data}`) 으로 응답, MSW mock 은 transformer 적용 후
    // inner data 만 wire 로 보내므로 두 wire format 모두 처리.
    if (json && typeof json === 'object' && 'success' in json) {
      const env = json as ApiSuccessResponse<T> | ApiErrorResponse
      if (!env.success) {
        throw new ApiError(env.error.code, env.error.message)
      }
      return env.data
    }
    return json as T
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
