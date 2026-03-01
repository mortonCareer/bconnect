'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function OneClickError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <h2 className="text-sb-20 text-morton-gray-900">조회 중 오류가 발생했습니다</h2>
      <p className="mt-2 text-r-14 text-morton-gray-500">
        잠시 후 다시 시도해주세요. 문제가 지속되면 관리자에게 문의해주세요.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg border border-morton-gray-300 px-4 py-2 text-sm text-morton-gray-700 hover:bg-morton-gray-50"
      >
        다시 시도
      </button>
    </div>
  )
}
