'use client'

import { useCallback } from 'react'
import { SendIcon, toast } from '@bconnect/ui'

export function ShareButton() {
  const handleShare = useCallback(async () => {
    const shareData = {
      title: document.title,
      url: window.location.href,
    }

    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData)
      return
    }

    await navigator.clipboard.writeText(window.location.href)
    toast({ description: '링크가 복사되었어요', variant: 'success' })
  }, [])

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
      aria-label="공유하기"
    >
      <SendIcon size={20} className="text-gray-400" />
    </button>
  )
}
