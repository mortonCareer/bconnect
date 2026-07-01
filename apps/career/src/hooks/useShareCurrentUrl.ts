'use client'

import { toast } from '@bconnect/ui'
import { useCallback } from 'react'

/**
 * 현재 URL 공유 — Web Share API(모바일 네이티브 시트) → 미지원 시 클립보드 복사 + 토스트.
 * 기술자 프로필 공유와 동일 동작 (#650). profile/_adapters/CareerProfileView 와 한 출처를 공유한다.
 */
export function useShareCurrentUrl() {
  return useCallback(async () => {
    const shareData = { title: document.title, url: window.location.href }
    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData)
      return
    }
    await navigator.clipboard.writeText(window.location.href)
    toast({ description: '링크가 복사되었어요', variant: 'success' })
  }, [])
}
