export {
  apiClient,
  customFetch,
  setAccessToken,
  getAccessToken,
  refreshAccessToken,
  ApiError,
} from './client'

export { AUTH_HINT_COOKIE, setAuthHint, clearAuthHint } from './auth-hint'

export { getQueryClient, queryClientConfig } from './query-client'

// Re-export react-query for app usage
export {
  QueryClientProvider,
  useInfiniteQuery,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
export type { InfiniteData } from '@tanstack/react-query'
export { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Generated API hooks & types
export * from './generated/api'
export * from './generated/schemas'

// Hand-written domain labels (enum-coupled: Trade / CredentialType)
export * from './labels'

// ⚠️ 임시 호환 레이어 (dev 합치기 전 삭제) — 옛 이름을 현재 기능에 임시로 이어 붙인 것.
//    개편 중 여러 화면이 아직 옛 이름을 불러 미리보기 서버가 안 뜨는 걸 막는 용도.
//    각 화면 정합되면 _temp-compat.ts 에서 해당 줄 삭제, 전부 끝나면 이 줄과 파일 삭제.
export * from './_temp-compat'
