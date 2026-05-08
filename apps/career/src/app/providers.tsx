'use client'

import { useEffect, useRef } from 'react'
import {
  QueryClientProvider,
  ReactQueryDevtools,
  getQueryClient,
  refreshAccessToken,
} from '@bconnect/api-client'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'
import '../env'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { InAppNotification } from '@/components/in-app-notification'

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      refreshAccessToken()
    }
  }, [])

  // FCM 토큰 등록/포그라운드 수신 리스너를 앱 최상위에서 1회 활성화
  usePushNotifications()

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <InAppNotification />
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
