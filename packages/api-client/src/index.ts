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
export { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Generated API hooks & types
export * from './generated/api'
export * from './generated/schemas'

// Hand-written domain labels (enum-coupled: Trade / CredentialType)
export * from './labels'
