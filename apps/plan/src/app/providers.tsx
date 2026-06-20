'use client'

import { QueryClientProvider, ReactQueryDevtools, getQueryClient } from '@bconnect/api-client'
import { Toaster } from '@bconnect/ui'
import type { ReactNode } from 'react'
import { MSWProvider, DevToolbar } from '@bconnect/mocks/react'
import '../env'

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <MSWProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
        <DevToolbar />
      </QueryClientProvider>
    </MSWProvider>
  )
}
