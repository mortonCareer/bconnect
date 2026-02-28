export { apiClient, customFetch, setAccessToken, getAccessToken, ApiError } from './client'

export { getQueryClient, queryClientConfig } from './query-client'

// Re-export react-query for app usage
export {
  QueryClientProvider,
  useInfiniteQuery,
  useQueries,
  useQueryClient,
} from '@tanstack/react-query'
export { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Generated API hooks & types
export * from './generated/api'
export * from './generated/schemas'
