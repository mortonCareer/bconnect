'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// MSW 초기화 게이트.
// dev 환경에서만 Service Worker 를 등록하고, 등록 완료 전까지 children 렌더 차단.
// 차단하지 않으면 첫 페이지 fetch 가 SW 등록 전에 발사되어 실서버로 통과 → 의도와 다른 동작.
// production 빌드에선 import 자체가 tree-shake 되어 mock 코드가 번들에 포함되지 않음.
export function MSWProvider({ children }: { children: ReactNode }) {
  const enabled = process.env.NODE_ENV === 'development'
  const [ready, setReady] = useState(!enabled)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    ;(async () => {
      const { worker } = await import('@/mocks/browser')
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: { url: '/mockServiceWorker.js' },
      })
      if (!cancelled) setReady(true)
    })().catch((e) => {
      console.error('[MSW] 초기화 실패 — mock 없이 진행', e)
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [enabled])

  if (!ready) return null
  return <>{children}</>
}
