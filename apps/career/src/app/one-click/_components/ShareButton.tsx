'use client'

import { useCallback } from 'react'

export function ShareButton() {
  const handleShare = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href)
  }, [])

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-morton-gray-100"
      aria-label="링크 복사"
    >
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
    </button>
  )
}
