'use client'

import { QueryClientProvider, ReactQueryDevtools, getQueryClient } from '@morton/api-client'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
