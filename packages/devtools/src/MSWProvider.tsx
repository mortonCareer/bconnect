'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// MSW 초기화 게이트.
// 로컬 dev (NODE_ENV=development) + Vercel preview (VERCEL_ENV=preview) 에서 Service
// Worker 를 등록하고, 등록 완료 전까지 children 렌더 차단. 차단하지 않으면 첫 페이지
// fetch 가 SW 등록 전에 발사되어 실서버로 통과 → 의도와 다른 동작.
// production 배포에선 import 자체가 tree-shake 되어 mock 코드가 번들에 포함되지 않음.
// NEXT_PUBLIC_API_MOCKING=disabled 인 환경(dev custom env → 실 staging BE)은 제외 (#352).
export function MSWProvider({ children }: { children: ReactNode }) {
  const enabled =
    (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') &&
    process.env.NEXT_PUBLIC_API_MOCKING !== 'disabled'
  const [ready, setReady] = useState(!enabled)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    ;(async () => {
      const { worker } = await import('@bconnect/mocks/browser')
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
