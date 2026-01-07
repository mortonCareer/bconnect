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
async function refreshAccessToken(): Promise<boolean> {
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
        if (response.status === 401) {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            request.headers.set('Authorization', `Bearer ${accessToken}`)
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
  signal?: AbortSignal
}

export async function customFetch<T>(config: RequestConfig, _options?: RequestInit): Promise<T> {
  // ky prefixUrl은 슬래시로 시작하는 경로를 허용하지 않음
  const normalizedUrl = config.url.startsWith('/') ? config.url.slice(1) : config.url

  try {
    const response = await apiClient(normalizedUrl, {
      method: config.method,
      json: config.data,
      headers: config.headers,
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
