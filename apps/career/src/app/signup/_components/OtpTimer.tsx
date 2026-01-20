'use client'

import { useEffect, useState, useCallback } from 'react'

interface OtpTimerProps {
  expiresAt: string | null
  onResend: () => Promise<void>
  isResending?: boolean
}

function calculateRemainingTime(expiresAt: string | null): number {
  if (!expiresAt) return 0
  const expiresAtDate = new Date(expiresAt)
  const now = new Date()
  return Math.max(0, Math.floor((expiresAtDate.getTime() - now.getTime()) / 1000))
}

function TimerDisplay({ expiresAt }: { expiresAt: string | null }) {
  const [remainingTime, setRemainingTime] = useState<number>(() =>
    calculateRemainingTime(expiresAt)
  )

  // 타이머 카운트다운
  useEffect(() => {
    if (remainingTime <= 0) return

    const timer = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [remainingTime])

  // 타이머 포맷 (m:ss)
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  if (remainingTime <= 0) return null

  return <span className="text-[#9C9C9C]">{formatTime(remainingTime)}</span>
}

export function OtpTimer({ expiresAt, onResend, isResending }: OtpTimerProps) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {/* key를 사용해 expiresAt 변경 시 TimerDisplay 리마운트 */}
      <TimerDisplay key={expiresAt} expiresAt={expiresAt} />
      <button
        type="button"
        onClick={onResend}
        disabled={isResending}
        className="font-medium text-[#386DFF] disabled:opacity-50"
      >
        재요청
      </button>
    </div>
  )
}
