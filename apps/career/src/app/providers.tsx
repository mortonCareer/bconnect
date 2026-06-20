'use client'

import { useEffect, useRef } from 'react'
import {
  QueryClientProvider,
  ReactQueryDevtools,
  getQueryClient,
  refreshAccessToken,
} from '@bconnect/api-client'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from '@bconnect/ui'
import type { ReactNode } from 'react'
import '../env'
import { MSWProvider, DevToolbar } from '@bconnect/mocks/react'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { InAppNotification } from '@/components/in-app-notification'

// MSW 가 fetch 를 가로채야 하는 모든 부수효과(refresh token, FCM device 등록)는
// MSWProvider 가 ready 가 된 후 실행되어야 함. 그렇지 않으면 dev 첫 페이지 로드 시
// SW 등록 전에 fetch 가 발사되어 MSW 가 가로채지 못함.
function PostMSWBootstrap({ children }: { children: ReactNode }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    refreshAccessToken()
  }, [])

  usePushNotifications()

  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <MSWProvider>
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          <PostMSWBootstrap>
            <InAppNotification />
            {children}
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
            <DevToolbar />
          </PostMSWBootstrap>
        </QueryClientProvider>
      </NuqsAdapter>
    </MSWProvider>
  )
}
