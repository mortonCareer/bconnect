'use client'

import { useCallback, useState } from 'react'
import { CheckIcon, SendIcon } from '@bconnect/ui'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

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
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [])

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
      aria-label={copied ? '링크 복사됨' : '공유하기'}
    >
      {copied ? (
        <CheckIcon size={20} className="text-green-500" />
      ) : (
        <SendIcon size={20} className="text-gray-400" />
      )}
    </button>
  )
}
