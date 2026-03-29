'use client'

import { useEffect, useRef } from 'react'
import {
  QueryClientProvider,
  ReactQueryDevtools,
  getQueryClient,
  refreshAccessToken,
} from '@morton/api-client'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'
import '../env'

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      refreshAccessToken()
    }
  }, [])

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
