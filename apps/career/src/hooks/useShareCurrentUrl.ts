'use client'

import { toast } from '@bconnect/ui'
import { useCallback } from 'react'

/**
 * 현재 URL 공유 — Web Share API(모바일 네이티브 시트) → 미지원 시 클립보드 복사 + 토스트.
 * 기술자 프로필 공유와 동일 동작 (#650). profile/_adapters/CareerProfileView 와 한 출처를 공유한다.
 * URL state default가 실제 주소에 없을 수 있는 화면은 getUrl로 공유 URL을 보강한다.
 */
export function useShareCurrentUrl(options?: { getUrl?: () => string }) {
  const getUrl = options?.getUrl

  return useCallback(async () => {
    const shareData = { title: document.title, url: getUrl?.() ?? window.location.href }
    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData)
      return
    }
    await navigator.clipboard.writeText(shareData.url)
    toast({ description: '링크가 복사되었어요', variant: 'success' })
  }, [getUrl])
}
