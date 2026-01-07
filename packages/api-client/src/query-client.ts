import { QueryClient, type QueryClientConfig } from '@tanstack/react-query'
import { cache } from 'react'

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
}

let browserQueryClient: QueryClient | undefined

export const getQueryClient = cache(() => {
  if (typeof window === 'undefined') {
    return new QueryClient(queryClientConfig)
  }

  if (!browserQueryClient) {
    browserQueryClient = new QueryClient(queryClientConfig)
  }
  return browserQueryClient
})
