'use client'

import { QueryClientProvider, ReactQueryDevtools, getQueryClient } from '@bconnect/api-client'
import type { ReactNode } from 'react'
import '../env'

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
