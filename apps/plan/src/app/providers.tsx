'use client'

import { QueryClientProvider, ReactQueryDevtools, getQueryClient } from '@bconnect/api-client'
import type { ReactNode } from 'react'
import '../env'
import { MSWProvider } from '@/components/msw-provider'

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <MSWProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </MSWProvider>
  )
}
