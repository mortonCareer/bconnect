'use client'

import { useCallback, useState } from 'react'

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
      className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-morton-gray-100"
      aria-label={copied ? '링크 복사됨' : '공유하기'}
    >
      {copied ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 10l3.75 3.75L15 6.25"
            stroke="#22C55E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 6.667a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM15 18.333a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM7.158 11.258l5.692 3.234M12.842 5.508 7.158 8.742"
            stroke="#9C9C9C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
