'use client'

import { QueryClientProvider, ReactQueryDevtools, getQueryClient } from '@bconnect/api-client'
import { Toaster } from '@bconnect/ui'
import type { ReactNode } from 'react'
import { MSWProvider, DevToolbar } from '@bconnect/devtools'
import { usePushNotificationListener, InAppNotification } from '@bconnect/push'
import '../env'

// FCM 부수효과(SW·onMessage·토큰 등록)는 MSWProvider ready 후 실행되어야 함 —
// 그렇지 않으면 dev 첫 로드 시 SW 등록 전 fetch 가 MSW 를 우회한다.
function PushBootstrap() {
  usePushNotificationListener()
  return <InAppNotification />
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <MSWProvider>
      <QueryClientProvider client={queryClient}>
        <PushBootstrap />
        {children}
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
        <DevToolbar />
      </QueryClientProvider>
    </MSWProvider>
  )
}
