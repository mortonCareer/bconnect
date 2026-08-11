export {
  apiClient,
  customFetch,
  setAccessToken,
  getAccessToken,
  refreshAccessToken,
  ApiError,
} from './client'

export { AUTH_HINT_COOKIE, setAuthHint, clearAuthHint, readAuthHint } from './auth-hint'
export { useAuthHint } from './use-auth-hint'

export { ERROR_CODE, isApiError, hasErrorCode, isRegisterMemberSignupSessionError } from './errors'
export type { ErrorCode } from './errors'

export { requireRegisterAccessToken } from './register'

export { getQueryClient, queryClientConfig } from './query-client'

// Re-export react-query for app usage
export {
  QueryClientProvider,
  useInfiniteQuery,
  useMutation,
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

export { postImageUrls } from './post'
