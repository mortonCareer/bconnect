'use client'

import { Toaster } from 'sonner'

/**
 * sonner 토스트 컨테이너. 푸시 권한 soft-ask(데스크톱) 등을 렌더.
 * 앱 루트(providers)에 1회 마운트한다.
 *
 * (기존 radix Toaster 와 일시 공존 — 전역 radix→sonner 마이그레이션은 별도 PR)
 */
export function PushToaster() {
  return <Toaster position="bottom-right" theme="light" />
}
