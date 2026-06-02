'use client'

import { useOtpTimer } from '@bconnect/ui'

interface OtpTimerProps {
  expiresAt: string | null
  onResend: () => Promise<void>
  isResending?: boolean
}

function TimerDisplay({ expiresAt }: { expiresAt: string | null }) {
  const { formatted, expired } = useOtpTimer(expiresAt)
  if (expired) return null
  return <span className="text-[#9C9C9C]">{formatted}</span>
}

export function OtpTimer({ expiresAt, onResend, isResending }: OtpTimerProps) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <TimerDisplay expiresAt={expiresAt} />
      <button
        type="button"
        onClick={onResend}
        disabled={isResending}
        className="font-medium text-primary disabled:opacity-50"
      >
        재요청
      </button>
    </div>
  )
}
